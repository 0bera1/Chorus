import { z } from 'zod';

/** Slayt tipleri (MVP) */
export const SLIDE_TYPES = ['multiple_choice', 'word_cloud', 'scale', 'open_text', 'qa'] as const;
export const slideTypeSchema = z.enum(SLIDE_TYPES);
export type SlideType = z.infer<typeof slideTypeSchema>;

export const ROOM_STATUSES = ['lobby', 'live', 'ended'] as const;
export const roomStatusSchema = z.enum(ROOM_STATUSES);
export type RoomStatus = z.infer<typeof roomStatusSchema>;

export const ROOM_CODE_LENGTH = 6;
/** Karışıklık yaratan karakterler (0/O, 1/I/L) dışarıda bırakıldı */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const roomCodeSchema = z
  .string()
  .length(ROOM_CODE_LENGTH)
  .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]+$`), 'Geçersiz oda kodu');

export const LIMITS = {
  presentationTitle: 120,
  slideQuestion: 300,
  optionText: 120,
  wordCloudWord: 30,
  openTextAnswer: 280,
  qaQuestion: 280,
  nickname: 24,
  slidesPerPresentation: 60,
  optionsPerSlide: { min: 2, max: 8 },
  scaleRange: { min: 1, max: 5 },
} as const;

const optionSchema = z.object({
  id: z.string().min(1).max(40),
  text: z.string().trim().min(1).max(LIMITS.optionText),
});

const slideSettingsSchema = z.object({
  allowVoteChange: z.boolean().default(false),
  showResults: z.boolean().default(false),
  votingOpen: z.boolean().default(false),
  hideOpenText: z.boolean().default(false),
});

export const slideInputSchema = z
  .object({
    type: slideTypeSchema,
    question: z.string().trim().min(1).max(LIMITS.slideQuestion),
    options: z.array(optionSchema).max(LIMITS.optionsPerSlide.max).default([]),
    settings: slideSettingsSchema.default({}),
  })
  .superRefine((slide, ctx) => {
    if (slide.type === 'multiple_choice') {
      const n = slide.options.length;
      if (n < LIMITS.optionsPerSlide.min || n > LIMITS.optionsPerSlide.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Çoktan seçmeli soruda ${LIMITS.optionsPerSlide.min}-${LIMITS.optionsPerSlide.max} seçenek olmalı`,
          path: ['options'],
        });
      }
    }
  });
export type SlideInput = z.input<typeof slideInputSchema>;
export type Slide = z.infer<typeof slideInputSchema> & { id: string; position: number };

export const createPresentationSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.presentationTitle),
  slides: z.array(slideInputSchema).max(LIMITS.slidesPerPresentation).default([]),
});
export type CreatePresentationInput = z.input<typeof createPresentationSchema>;

export const updateSlidesSchema = z.object({
  slides: z.array(slideInputSchema).max(LIMITS.slidesPerPresentation),
});

/** Oy payload'ları — slayt tipine göre ayrışır */
export const votePayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('multiple_choice'), optionId: z.string().min(1).max(40) }),
  z.object({ type: z.literal('word_cloud'), word: z.string().trim().min(1).max(LIMITS.wordCloudWord) }),
  z.object({
    type: z.literal('scale'),
    value: z.number().int().min(LIMITS.scaleRange.min).max(LIMITS.scaleRange.max),
  }),
  z.object({ type: z.literal('open_text'), text: z.string().trim().min(1).max(LIMITS.openTextAnswer) }),
]);
export type VotePayload = z.infer<typeof votePayloadSchema>;

export const qaQuestionSchema = z.object({
  text: z.string().trim().min(3).max(LIMITS.qaQuestion),
});
