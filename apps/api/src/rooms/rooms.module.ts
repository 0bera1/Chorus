import { Module } from '@nestjs/common';
import { PresentationsModule } from '../presentations/presentations.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [PresentationsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
