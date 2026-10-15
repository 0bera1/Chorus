import { Module } from '@nestjs/common';
import { CryptoService } from '../common/crypto.service';
import { PresentationsModule } from '../presentations/presentations.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [PresentationsModule],
  providers: [RealtimeService, RealtimeGateway, CryptoService],
})
export class RealtimeModule {}
