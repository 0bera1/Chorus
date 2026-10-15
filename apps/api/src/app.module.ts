import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { PresentationsModule } from './presentations/presentations.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [DbModule, PresentationsModule, RoomsModule, RealtimeModule],
  controllers: [HealthController],
})
export class AppModule {}
