import { Body, Controller, Get, Headers, HttpCode, Param, Post, Put } from '@nestjs/common';
import { createPresentationSchema, updateSlidesSchema } from '@chorus/shared';
import { ZodPipe } from '../common/zod.pipe';
import { PresentationsService } from './presentations.service';
import { z } from 'zod';

const uuidPipe = new ZodPipe(z.string().uuid('Geçersiz sunum kimliği'));

@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentations: PresentationsService) {}

  @Post()
  create(@Body(new ZodPipe(createPresentationSchema)) body: z.output<typeof createPresentationSchema>) {
    return this.presentations.create(body);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string, @Headers('x-host-key') hostKey?: string) {
    return this.presentations.getForHost(id, hostKey);
  }

  @Put(':id/slides')
  @HttpCode(200)
  replaceSlides(
    @Param('id', uuidPipe) id: string,
    @Headers('x-host-key') hostKey: string | undefined,
    @Body(new ZodPipe(updateSlidesSchema)) body: z.output<typeof updateSlidesSchema>,
  ) {
    return this.presentations.replaceSlides(id, hostKey, body.slides);
  }
}
