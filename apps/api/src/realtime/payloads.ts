import { z } from 'zod';
import { LIMITS, qaQuestionSchema, roomCodeSchema, votePayloadSchema } from '@chorus/shared';
import { AppError } from '../common/app-error';

/** Oda kodu: büyük/küçük harf fark etmez, boşluk kırpılır */
const codeSchema = z.string().trim().toUpperCase().pipe(roomCodeSchema);

export const joinPayloadSchema = z.discriminatedUnion('role', [
  z.object({
    code: codeSchema,
    role: z.literal('host'),
    hostKey: z.string().min(10).max(200),
  }),
  z.object({
    code: codeSchema,
    role: z.literal('participant'),
    token: z.string().min(10).max(200).optional(),
    nickname: z.string().trim().max(LIMITS.nickname).optional(),
  }),
]);

export const setSlideSchema = z.object({
  slideIndex: z.number().int().min(0).max(LIMITS.slidesPerPresentation - 1),
});

export const toggleVotingSchema = z.object({ open: z.boolean() });
export const toggleResultsSchema = z.object({ show: z.boolean() });

export const voteSubmitSchema = z.object({ payload: votePayloadSchema });
export const qaAskSchema = qaQuestionSchema;
export const qaUpvoteSchema = z.object({ questionId: z.string().uuid() });

/** Gelen socket payload'ını doğrular; hata olursa 400 benzeri AppError fırlatır. */
export function parsePayload<S extends z.ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? 'Geçersiz istek', result.error.issues);
  }
  return result.data;
}
