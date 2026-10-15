import { Controller, Get, Headers, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { RoomsService } from './rooms.service';

const uuidPipe = new ZodPipe(z.string().uuid('Geçersiz kimlik'));
const roomCodePipe = new ZodPipe(z.string().trim().length(6, 'Oda kodu 6 haneli olmalı'));

@Controller()
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post('presentations/:id/rooms')
  create(@Param('id', uuidPipe) id: string, @Headers('x-host-key') hostKey?: string) {
    return this.rooms.create(id, hostKey);
  }

  @Get('rooms/:code')
  find(@Param('code', roomCodePipe) code: string) {
    return this.rooms.findByCode(code);
  }

  @Get('rooms/:id/export')
  async export(
    @Param('id', uuidPipe) id: string,
    @Query(new ZodPipe(z.object({ format: z.enum(['csv', 'json']).default('json') }))) query: { format: 'csv' | 'json' },
    @Headers('x-host-key') hostKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.rooms.exportResponses(id, hostKey, query.format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="chorus-export.${query.format}"`);
    return file.body;
  }
}
