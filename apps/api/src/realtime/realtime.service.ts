import { HttpStatus, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import type { PublicSlide, RoomSnapshot, SlideResults, VotePayload } from '@chorus/shared';
import { MAX_PARTICIPANTS_PER_ROOM, RESULTS_BATCH_INTERVAL_MS } from '@chorus/shared';
import type { Server, Socket } from 'socket.io';
import { config } from '../config';
import { AppError } from '../common/app-error';
import { CryptoService } from '../common/crypto.service';
import { PresentationsService } from '../presentations/presentations.service';
import { DB } from '../db/db.module';
import type { Db } from '../db/client';
import { participants, qaQuestions, qaUpvotes, responses, rooms, slides } from '../db/schema';
import { RateLimiter } from './rate-limiter';
import { RoomRuntime } from './room-runtime';
import { aggregateResults, normalizeVote, resolveVoteAction, sanitizeText } from './vote';

export interface SocketSession {
  role?: 'host' | 'participant';
  code?: string;
  roomId?: string;
  presentationId?: string;
  participantId?: string;
}

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const VOTE_RATE_LIMIT = { limit: 10, windowMs: 10_000 };
const MAX_ROOM_PARTICIPANTS = Math.min(config.roomMaxParticipants, MAX_PARTICIPANTS_PER_ROOM);

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Realtime');
  private readonly runtimes = new Map<string, RoomRuntime>();
  private readonly actionLimiter = new RateLimiter(VOTE_RATE_LIMIT.limit, VOTE_RATE_LIMIT.windowMs);
  private server?: Server;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly crypto: CryptoService,
    private readonly presentations: PresentationsService,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => void this.cleanupIdleRooms(), CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const runtime of this.runtimes.values()) runtime.dispose();
  }

  attach(server: Server) {
    this.server = server;
  }

  /* ---------------- Katılım ---------------- */

  async join(
    socket: Socket,
    input:
      | { code: string; role: 'host'; hostKey: string }
      | { code: string; role: 'participant'; token?: string; nickname?: string },
  ) {
    this.unbind(socket);
    const runtime = await this.loadRuntime(input.code);

    if (input.role === 'host') {
      await this.presentations.assertHost(runtime.presentationId, input.hostKey);
      this.bind(socket, { role: 'host', code: runtime.code, roomId: runtime.roomId, presentationId: runtime.presentationId });
      void socket.join(hostRoom(runtime.code));
      runtime.touch();
      return { snapshot: await this.snapshot(runtime, this.session(socket)) };
    }

    const { participantId, token } = await this.resolveParticipant(runtime, input.token, input.nickname);
    this.bind(socket, {
      role: 'participant',
      code: runtime.code,
      roomId: runtime.roomId,
      presentationId: runtime.presentationId,
      participantId,
    });
    void socket.join(participantRoom(runtime.code));
    runtime.addConnection(participantId);
    runtime.touch();
    this.broadcastCount(runtime);

    return { token, snapshot: await this.snapshot(runtime, this.session(socket)) };
  }

  handleDisconnect(socket: Socket) {
    const session = this.session(socket);
    if (session.role !== 'participant' || !session.code || !session.participantId) return;
    const runtime = this.runtimes.get(session.code);
    if (!runtime) return;
    runtime.removeConnection(session.participantId);
    this.broadcastCount(runtime);
  }

  /* ---------------- Host kontrolleri ---------------- */

  async setSlide(socket: Socket, slideIndex: number) {
    const runtime = this.requireHostRuntime(socket);
    const slide = runtime.slides[slideIndex];
    if (!slide) throw AppError.badRequest('Slayt bulunamadı');

    runtime.currentIndex = slideIndex;
    runtime.status = 'live';
    runtime.votingOpen = false;
    runtime.showResults = false;
    runtime.touch();

    await this.db
      .update(rooms)
      .set({ status: 'live', currentSlideId: slide.id })
      .where(eq(rooms.id, runtime.roomId));

    this.broadcastSlide(runtime);
    await this.emitResults(runtime, slide, 'host');
  }

  toggleVoting(socket: Socket, open: boolean) {
    const runtime = this.requireHostRuntime(socket);
    this.requireCurrentSlide(runtime);
    runtime.votingOpen = open;
    runtime.touch();
    this.broadcastSlide(runtime);
  }

  async toggleResults(socket: Socket, show: boolean) {
    const runtime = this.requireHostRuntime(socket);
    const slide = this.requireCurrentSlide(runtime);
    runtime.showResults = show;
    runtime.touch();
    this.broadcastSlide(runtime);
    await this.emitResults(runtime, slide, 'both');
  }

  async endRoom(socket: Socket) {
    const runtime = this.requireHostRuntime(socket);
    await this.db
      .update(rooms)
      .set({ status: 'ended', endedAt: new Date() })
      .where(eq(rooms.id, runtime.roomId));
    this.closeRoom(runtime);
  }

  /* ---------------- Katılımcı eylemleri ---------------- */

  async submitVote(socket: Socket, payload: VotePayload) {
    const session = this.requireParticipant(socket);
    this.checkRate(session.participantId!);
    const runtime = this.requireRuntime(session.code!);
    const slide = this.requireCurrentSlide(runtime);

    if (!runtime.votingOpen) throw new AppError(HttpStatus.CONFLICT, 'voting_closed', 'Oylama kapalı');
    if (slide.type === 'qa') throw AppError.badRequest('Bu slayta oy verilemez, soru sorabilirsiniz');

    const normalized = normalizeVote(slide, payload);
    if (!normalized.ok) throw AppError.badRequest(normalized.message);

    const [inserted] = await this.db
      .insert(responses)
      .values({
        roomId: runtime.roomId,
        slideId: slide.id,
        participantId: session.participantId!,
        payload: normalized.payload,
      })
      .onConflictDoNothing({ target: [responses.slideId, responses.participantId] })
      .returning({ id: responses.id });

    const action = resolveVoteAction({ alreadyVoted: !inserted, allowVoteChange: slide.settings.allowVoteChange });
    if (action === 'reject') {
      throw new AppError(HttpStatus.CONFLICT, 'already_voted', 'Bu slayta zaten oy verdiniz');
    }
    if (action === 'update') {
      await this.db
        .update(responses)
        .set({ payload: normalized.payload, createdAt: new Date() })
        .where(and(eq(responses.slideId, slide.id), eq(responses.participantId, session.participantId!)));
    }

    runtime.touch();
    runtime.markDirty(slide.id);
    this.scheduleFlush(runtime);
    socket.emit('vote:ack', { accepted: true });
    return { accepted: true as const };
  }

  async askQuestion(socket: Socket, text: string) {
    const session = this.requireParticipant(socket);
    this.checkRate(session.participantId!);
    const runtime = this.requireRuntime(session.code!);
    const slide = this.requireCurrentSlide(runtime);
    if (slide.type !== 'qa') throw new AppError(HttpStatus.CONFLICT, 'not_qa_slide', 'Şu an soru sorulamaz');

    const clean = sanitizeText(text);
    if (clean.length < 3) throw AppError.badRequest('Soru çok kısa');

    const [row] = await this.db
      .insert(qaQuestions)
      .values({ roomId: runtime.roomId, participantId: session.participantId!, text: clean })
      .returning({ id: qaQuestions.id });

    runtime.touch();
    runtime.markDirty(slide.id);
    this.scheduleFlush(runtime);
    return { id: row!.id };
  }

  async upvoteQuestion(socket: Socket, questionId: string) {
    const session = this.requireParticipant(socket);
    this.checkRate(session.participantId!);
    const runtime = this.requireRuntime(session.code!);
    const slide = this.requireCurrentSlide(runtime);
    if (slide.type !== 'qa') throw new AppError(HttpStatus.CONFLICT, 'not_qa_slide', 'Şu an oy verilemez');

    const [question] = await this.db
      .select({ id: qaQuestions.id })
      .from(qaQuestions)
      .where(and(eq(qaQuestions.id, questionId), eq(qaQuestions.roomId, runtime.roomId)));
    if (!question) throw AppError.notFound('Soru');

    const [inserted] = await this.db
      .insert(qaUpvotes)
      .values({ questionId, participantId: session.participantId! })
      .onConflictDoNothing()
      .returning({ questionId: qaUpvotes.questionId });
    if (!inserted) throw new AppError(HttpStatus.CONFLICT, 'already_upvoted', 'Bu soruyu zaten beğendiniz');

    runtime.touch();
    runtime.markDirty(slide.id);
    this.scheduleFlush(runtime);
    return { accepted: true as const };
  }

  /* ---------------- Sonuçlar ---------------- */

  /** Katılımcı görünümü ve host görünümü için anlık sonuç hesaplar. */
  async buildResults(runtime: RoomRuntime, slide: PublicSlide, forHost: boolean, participantId?: string): Promise<SlideResults> {
    if (slide.type === 'qa') return this.buildQaResults(runtime, participantId);

    const rows = await this.db
      .select({ id: responses.id, payload: responses.payload })
      .from(responses)
      .where(eq(responses.slideId, slide.id));
    const results = aggregateResults(
      slide,
      rows.map((row) => ({ id: row.id, payload: row.payload as VotePayload })),
    );

    if (!forHost && results.type === 'open_text' && slide.settings.hideOpenText) {
      return { ...results, texts: [] };
    }
    return results;
  }

  private async buildQaResults(runtime: RoomRuntime, participantId?: string): Promise<SlideResults> {
    const questions = await this.db
      .select({ id: qaQuestions.id, text: qaQuestions.text })
      .from(qaQuestions)
      .where(eq(qaQuestions.roomId, runtime.roomId))
      .orderBy(asc(qaQuestions.createdAt));
    const upvotes = await this.db
      .select({ questionId: qaUpvotes.questionId, participantId: qaUpvotes.participantId })
      .from(qaUpvotes)
      .innerJoin(qaQuestions, eq(qaUpvotes.questionId, qaQuestions.id))
      .where(eq(qaQuestions.roomId, runtime.roomId));

    const counts = new Map<string, number>();
    const mine = new Set<string>();
    for (const vote of upvotes) {
      counts.set(vote.questionId, (counts.get(vote.questionId) ?? 0) + 1);
      if (vote.participantId === participantId) mine.add(vote.questionId);
    }

    const ranked = questions
      .map((q) => ({ id: q.id, text: q.text, upvotes: counts.get(q.id) ?? 0, hidden: false, mine: mine.has(q.id) }))
      .sort((a, b) => b.upvotes - a.upvotes);
    return { type: 'qa', total: questions.length, questions: ranked };
  }

  /** Sonucu batch'e koyar; sonuç aynı anda birçok oyda 200 ms'de bir tek seferde yayınlanır. */
  private scheduleFlush(runtime: RoomRuntime) {
    if (runtime.flushTimer) return;
    runtime.flushTimer = setTimeout(() => {
      runtime.flushTimer = null;
      const ids = [...runtime.dirtySlideIds];
      runtime.dirtySlideIds.clear();
      for (const id of ids) {
        const slide = runtime.slides.find((s) => s.id === id);
        if (!slide) continue;
        this.emitResults(runtime, slide, 'both').catch((err) => this.logger.error(err));
      }
    }, RESULTS_BATCH_INTERVAL_MS);
  }

  /**
   * Sonucu yayınlar. Host odası her zaman tam sonucu alır; katılımcılar ise
   * sonuçlar açıksa (veya Q&A ise) herkese açık görünümü alır.
   */
  private async emitResults(runtime: RoomRuntime, slide: PublicSlide, target: 'host' | 'both') {
    if (!this.server) return;
    const hostResults = await this.buildResults(runtime, slide, true);
    this.server.to(hostRoom(runtime.code)).emit('results:update', { slideId: slide.id, results: hostResults });

    if (target === 'both' && (slide.type === 'qa' || runtime.showResults)) {
      const viewerResults = await this.buildResults(runtime, slide, false);
      this.server.to(participantRoom(runtime.code)).emit('results:update', { slideId: slide.id, results: viewerResults });
    }
  }

  /* ---------------- Yardımcılar ---------------- */

  private async snapshot(runtime: RoomRuntime, session: SocketSession): Promise<RoomSnapshot> {
    const isHost = session.role === 'host';
    const current = runtime.currentSlide;

    let myVote: VotePayload | null = null;
    if (!isHost && current && current.type !== 'qa' && session.participantId) {
      const [row] = await this.db
        .select({ payload: responses.payload })
        .from(responses)
        .where(and(eq(responses.slideId, current.id), eq(responses.participantId, session.participantId)));
      myVote = (row?.payload as VotePayload | undefined) ?? null;
    }

    const showResults = isHost || current?.type === 'qa' || runtime.showResults;
    const results = current && showResults ? await this.buildResults(runtime, current, isHost, session.participantId) : null;

    return {
      code: runtime.code,
      status: runtime.status,
      role: session.role ?? 'participant',
      currentSlide: current,
      slideCount: runtime.slides.length,
      participantCount: runtime.participantCount,
      myVote,
      results,
    };
  }

  private async resolveParticipant(runtime: RoomRuntime, token: string | undefined, nickname: string | undefined) {
    if (token) {
      const [existing] = await this.db
        .select({ id: participants.id })
        .from(participants)
        .where(and(eq(participants.roomId, runtime.roomId), eq(participants.tokenHash, this.crypto.hash(token))));
      if (existing) return { participantId: existing.id, token };
    }

    const [countRow] = await this.db
      .select({ total: count() })
      .from(participants)
      .where(eq(participants.roomId, runtime.roomId));
    if ((countRow?.total ?? 0) >= MAX_ROOM_PARTICIPANTS) {
      throw new AppError(HttpStatus.CONFLICT, 'room_full', 'Oda dolu');
    }

    const newToken = this.crypto.newSecret();
    const [row] = await this.db
      .insert(participants)
      .values({ roomId: runtime.roomId, tokenHash: this.crypto.hash(newToken), nickname: nickname ?? null })
      .returning({ id: participants.id });
    return { participantId: row!.id, token: newToken };
  }

  private async loadRuntime(rawCode: string): Promise<RoomRuntime> {
    const code = rawCode.toUpperCase();
    const cached = this.runtimes.get(code);
    if (cached) return cached;

    const [room] = await this.db.select().from(rooms).where(eq(rooms.code, code));
    if (!room) throw AppError.notFound('Oda');
    if (room.status === 'ended') throw new AppError(HttpStatus.GONE, 'room_ended', 'Bu oda kapandı');

    const slideRows = await this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, room.presentationId))
      .orderBy(asc(slides.position));
    const index = slideRows.findIndex((s) => s.id === room.currentSlideId);

    const runtime = new RoomRuntime({
      code,
      roomId: room.id,
      presentationId: room.presentationId,
      status: room.status,
      slides: slideRows.map((s) => ({
        id: s.id,
        position: s.position,
        type: s.type as PublicSlide['type'],
        question: s.question,
        options: s.options,
        settings: s.settings,
      })),
      currentIndex: index >= 0 ? index : null,
    });
    this.runtimes.set(code, runtime);
    return runtime;
  }

  private runtimeOf(code: string | undefined): RoomRuntime | undefined {
    return code ? this.runtimes.get(code) : undefined;
  }

  private requireRuntime(code: string): RoomRuntime {
    const runtime = this.runtimeOf(code);
    if (!runtime) throw new AppError(HttpStatus.GONE, 'room_ended', 'Oda artık aktif değil, lütfen yeniden katılın');
    return runtime;
  }

  private requireHostRuntime(socket: Socket): RoomRuntime {
    const session = this.session(socket);
    if (session.role !== 'host') throw AppError.forbidden('Bu işlem yalnızca host içindir');
    return this.requireRuntime(session.code!);
  }

  private requireParticipant(socket: Socket): SocketSession {
    const session = this.session(socket);
    if (session.role !== 'participant' || !session.participantId || !session.code) {
      throw AppError.forbidden('Önce odaya katılmalısınız');
    }
    return session;
  }

  private requireCurrentSlide(runtime: RoomRuntime): PublicSlide {
    const slide = runtime.currentSlide;
    if (!slide) throw new AppError(HttpStatus.CONFLICT, 'no_active_slide', 'Aktif slayt yok');
    return slide;
  }

  private checkRate(key: string) {
    if (!this.actionLimiter.take(key)) {
      throw new AppError(HttpStatus.TOO_MANY_REQUESTS, 'rate_limited', 'Çok hızlı işlem yapıyorsunuz, lütfen biraz bekleyin');
    }
  }

  private broadcastSlide(runtime: RoomRuntime) {
    if (!this.server) return;
    const slide = runtime.currentSlide;
    this.server
      .to([hostRoom(runtime.code), participantRoom(runtime.code)])
      .emit('slide:changed', slide, runtime.currentIndex ?? -1);
  }

  private broadcastCount(runtime: RoomRuntime) {
    if (!this.server) return;
    this.server
      .to([hostRoom(runtime.code), participantRoom(runtime.code)])
      .emit('participants:count', { count: runtime.participantCount });
  }

  private closeRoom(runtime: RoomRuntime) {
    this.server?.to([hostRoom(runtime.code), participantRoom(runtime.code)]).emit('room:ended');
    this.server?.in([hostRoom(runtime.code), participantRoom(runtime.code)]).socketsLeave([
      hostRoom(runtime.code),
      participantRoom(runtime.code),
    ]);
    runtime.dispose();
    this.runtimes.delete(runtime.code);
  }

  /** Belleği boşaltır: uzun süre hareketsiz odalar kapatılır ve DB'de 'ended' işaretlenir. */
  private async cleanupIdleRooms() {
    const cutoff = Date.now() - config.roomIdleHours * 60 * 60 * 1000;
    for (const runtime of [...this.runtimes.values()]) {
      if (runtime.lastActivity > cutoff) continue;
      try {
        await this.db
          .update(rooms)
          .set({ status: 'ended', endedAt: new Date() })
          .where(eq(rooms.id, runtime.roomId));
        this.closeRoom(runtime);
      } catch (err) {
        this.logger.error(`Oda temizlenemedi (${runtime.code}): ${String(err)}`);
      }
    }
    this.actionLimiter.prune();
  }

  private session(socket: Socket): SocketSession {
    return (socket.data ?? {}) as SocketSession;
  }

  private bind(socket: Socket, session: SocketSession) {
    socket.data = { ...session };
  }

  private unbind(socket: Socket) {
    const session = this.session(socket);
    if (session.role === 'participant' && session.code && session.participantId) {
      const runtime = this.runtimeOf(session.code);
      if (runtime) {
        runtime.removeConnection(session.participantId);
        this.broadcastCount(runtime);
      }
    }
    socket.data = {};
  }
}

export const hostRoom = (code: string) => `room:${code}:host`;
export const participantRoom = (code: string) => `room:${code}`;
