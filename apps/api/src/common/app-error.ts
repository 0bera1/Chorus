import { HttpStatus } from '@nestjs/common';

/** Tüm API hataları bu sınıftan üretilir ve tek bir biçimde döner. */
export class AppError extends Error {
  constructor(
    readonly status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(HttpStatus.BAD_REQUEST, 'validation_error', message, details);
  }

  static unauthorized(message = 'Host anahtarı gerekli') {
    return new AppError(HttpStatus.UNAUTHORIZED, 'unauthorized', message);
  }

  static forbidden(message = 'Host anahtarı geçersiz') {
    return new AppError(HttpStatus.FORBIDDEN, 'forbidden', message);
  }

  static notFound(what: string) {
    return new AppError(HttpStatus.NOT_FOUND, 'not_found', `${what} bulunamadı`);
  }

  static conflict(message: string) {
    return new AppError(HttpStatus.CONFLICT, 'conflict', message);
  }
}
