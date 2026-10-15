import { Module } from '@nestjs/common';
import { CryptoService } from '../common/crypto.service';
import { PresentationsController } from './presentations.controller';
import { PresentationsService } from './presentations.service';

@Module({
  controllers: [PresentationsController],
  providers: [PresentationsService, CryptoService],
  exports: [PresentationsService, CryptoService],
})
export class PresentationsModule {}
