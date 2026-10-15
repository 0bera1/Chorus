import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { CreatePresentationInput, SlideInput } from '@chorus/shared';
import { AppError } from '../common/app-error';
import { CryptoService } from '../common/crypto.service';
import { DB } from '../db/db.module';
import type { Db } from '../db/client';
import { presentations, rooms, slides } from '../db/schema';

/** Controller'daki ZodPipe'tan geçmiş, varsayılanları uygulanmış slayt girdisi */
type ValidSlide = Omit<SlideInput, 'settings' | 'options'> & {
  options: { id: string; text: string }[];
  settings: { allowVoteChange: boolean; showResults: boolean; votingOpen: boolean; hideOpenText: boolean };
};

@Injectable()
export class PresentationsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly crypto: CryptoService,
  ) {}

  /** Hesapsız sunum oluşturur; host anahtarı yalnızca bu yanıtta bir kez döner. */
  async create(input: { title: string; slides: ValidSlide[] }) {
    const hostKey = this.crypto.newSecret();

    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(presentations)
        .values({ title: input.title, hostKeyHash: this.crypto.hash(hostKey) })
        .returning({ id: presentations.id });
      const presentationId = row!.id;
      if (input.slides.length > 0) {
        await tx.insert(slides).values(toSlideRows(presentationId, input.slides));
      }
      return presentationId;
    });

    return { id, hostKey };
  }

  /** Host anahtarı doğrulanır, sunum ve slaytları döner. */
  async getForHost(id: string, hostKey: string | undefined) {
    const presentation = await this.assertHost(id, hostKey);
    const slideRows = await this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, id))
      .orderBy(asc(slides.position));

    return {
      id: presentation.id,
      title: presentation.title,
      createdAt: presentation.createdAt,
      slides: slideRows.map(({ position, type, question, options, settings }) => ({
        position,
        type,
        question,
        options,
        settings,
      })),
    };
  }

  /** Tüm slaytları değiştirir. Canlı oda varsa reddedilir (oy kayıtları silinmesin diye). */
  async replaceSlides(id: string, hostKey: string | undefined, input: ValidSlide[]) {
    await this.assertHost(id, hostKey);

    await this.db.transaction(async (tx) => {
      const [live] = await tx
        .select({ id: rooms.id })
        .from(rooms)
        .where(and(eq(rooms.presentationId, id), eq(rooms.status, 'live')))
        .limit(1);
      if (live) throw AppError.conflict('Sunum canlıyken slaytlar düzenlenemez');

      await tx.delete(slides).where(eq(slides.presentationId, id));
      if (input.length > 0) {
        await tx.insert(slides).values(toSlideRows(id, input));
      }
    });

    return { count: input.length };
  }

  /** Host anahtarını doğrular, sunumu döner; geçersizse AppError fırlatır. */
  async assertHost(presentationId: string, hostKey: string | undefined) {
    if (!hostKey) throw AppError.unauthorized();
    const [row] = await this.db.select().from(presentations).where(eq(presentations.id, presentationId));
    if (!row) throw AppError.notFound('Sunum');
    if (!this.crypto.matches(hostKey, row.hostKeyHash)) throw AppError.forbidden();
    return row;
  }
}

function toSlideRows(presentationId: string, inputs: ValidSlide[]) {
  return inputs.map((slide, position) => ({
    presentationId,
    position,
    type: slide.type,
    question: slide.question,
    options: slide.options,
    settings: slide.settings,
  }));
}

export type { CreatePresentationInput };
