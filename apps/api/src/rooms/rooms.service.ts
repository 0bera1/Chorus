import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { config } from '../config';
import { AppError } from '../common/app-error';
import { CryptoService } from '../common/crypto.service';
import { PresentationsService } from '../presentations/presentations.service';
import { DB } from '../db/db.module';
import type { Db } from '../db/client';
import { participants, responses, rooms, slides } from '../db/schema';

/** Postgres benzersizlik ihlali kodu */
const UNIQUE_VIOLATION = '23505';
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class RoomsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly crypto: CryptoService,
    private readonly presentations: PresentationsService,
  ) {}

  /** Sunum için yeni bir oda açar (lobby durumunda). */
  async create(presentationId: string, hostKey: string | undefined) {
    await this.presentations.assertHost(presentationId, hostKey);

    const room = await this.insertWithUniqueCode(presentationId);
    const joinUrl = `${config.appUrl}/j/${room.code}`;
    return { id: room.id, code: room.code, joinUrl, qrData: joinUrl };
  }

  /** Katılım ekranı için odanın varlığını ve durumunu döner. */
  async findByCode(code: string) {
    const [room] = await this.db
      .select({ code: rooms.code, status: rooms.status })
      .from(rooms)
      .where(eq(rooms.code, code.toUpperCase()));
    if (!room) return { code, status: 'ended' as const, exists: false };
    return { code: room.code, status: room.status, exists: true };
  }

  /** Oturum sonu dışa aktarım: her slayt için tüm cevaplar (host anahtarı gerekir). */
  async exportResponses(roomId: string, hostKey: string | undefined, format: 'csv' | 'json') {
    const [room] = await this.db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!room) throw AppError.notFound('Oda');
    await this.presentations.assertHost(room.presentationId, hostKey);

    const rows = await this.db
      .select({
        slidePosition: slides.position,
        slideType: slides.type,
        question: slides.question,
        nickname: participants.nickname,
        payload: responses.payload,
        createdAt: responses.createdAt,
      })
      .from(responses)
      .innerJoin(slides, eq(responses.slideId, slides.id))
      .innerJoin(participants, eq(responses.participantId, participants.id))
      .where(eq(responses.roomId, roomId))
      .orderBy(asc(slides.position), asc(responses.createdAt));

    if (format === 'json') {
      return { contentType: 'application/json', body: JSON.stringify({ roomCode: room.code, responses: rows }, null, 2) };
    }

    const header = ['slide_position', 'slide_type', 'question', 'nickname', 'answer', 'created_at'];
    const lines = rows.map((r) =>
      [r.slidePosition + 1, r.slideType, r.question, r.nickname ?? '', JSON.stringify(r.payload), r.createdAt.toISOString()]
        .map(csvCell)
        .join(','),
    );
    return { contentType: 'text/csv; charset=utf-8', body: [header.join(','), ...lines].join('\n') };
  }

  private async insertWithUniqueCode(presentationId: string) {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        const [row] = await this.db
          .insert(rooms)
          .values({ presentationId, code: this.crypto.newRoomCode() })
          .returning({ id: rooms.id, code: rooms.code });
        return row!;
      } catch (err) {
        if ((err as { code?: string }).code !== UNIQUE_VIOLATION) throw err;
      }
    }
    throw AppError.conflict('Oda kodu üretilemedi, lütfen tekrar deneyin');
  }
}

/** CSV hücresi: tırnak kaçışı + formül enjeksiyonuna karşı önek */
function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
