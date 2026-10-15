import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { PresentationsModule } from './presentations/presentations.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [DbModule, PresentationsModule, RoomsModule],
  controllers: [HealthController],
})
export class AppModule {}
