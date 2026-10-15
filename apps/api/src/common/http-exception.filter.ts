import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from './app-error';

/** Her hatayı { error: { code, message, details? } } biçimine çevirir. */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body = { code: 'internal_error', message: 'Beklenmeyen bir hata oluştu' };

    if (exception instanceof AppError) {
      status = exception.status;
      body = { code: exception.code, message: exception.message, ...(exception.details ? { details: exception.details } : {}) };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = { code: 'http_error', message: exception.message };
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({ error: body });
  }
}
