import { PipeTransform } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from './app-error';

/** Girdiyi zod şemasıyla doğrular; hata olursa alan bazlı detaylarla 400 döner. */
export class ZodPipe<S extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      throw AppError.badRequest(details[0]?.message ?? 'Geçersiz istek', details);
    }
    return result.data;
  }
}
