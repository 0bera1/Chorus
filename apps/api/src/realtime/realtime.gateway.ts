import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { config } from '../config';
import { AppError } from '../common/app-error';
import {
  joinPayloadSchema,
  parsePayload,
  qaAskSchema,
  qaUpvoteSchema,
  setSlideSchema,
  toggleResultsSchema,
  toggleVotingSchema,
  voteSubmitSchema,
} from './payloads';
import { RealtimeService } from './realtime.service';

type Ack = { ok: true; [key: string]: unknown } | { ok: false; error: { code: string; message: string; details?: unknown } };

/**
 * Socket.IO girişi. Her olay doğrulanır, sonucu ack olarak döner.
 * İş mantığı RealtimeService içinde; gateway yalnızca yönlendirir.
 */
@WebSocketGateway({ cors: { origin: config.corsOrigins } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger('RealtimeGateway');

  constructor(private readonly realtime: RealtimeService) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
  }

  handleDisconnect(socket: Socket) {
    this.realtime.handleDisconnect(socket);
  }

  @SubscribeMessage('room:join')
  join(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const input = parsePayload(joinPayloadSchema, body);
      return this.realtime.join(socket, input);
    });
  }

  @SubscribeMessage('host:setSlide')
  setSlide(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { slideIndex } = parsePayload(setSlideSchema, body);
      await this.realtime.setSlide(socket, slideIndex);
      return {};
    });
  }

  @SubscribeMessage('host:toggleVoting')
  toggleVoting(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { open } = parsePayload(toggleVotingSchema, body);
      this.realtime.toggleVoting(socket, open);
      return {};
    });
  }

  @SubscribeMessage('host:toggleResults')
  toggleResults(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { show } = parsePayload(toggleResultsSchema, body);
      await this.realtime.toggleResults(socket, show);
      return {};
    });
  }

  @SubscribeMessage('host:endRoom')
  endRoom(@ConnectedSocket() socket: Socket): Promise<Ack> {
    return this.run(async () => {
      await this.realtime.endRoom(socket);
      return {};
    });
  }

  @SubscribeMessage('vote:submit')
  vote(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { payload } = parsePayload(voteSubmitSchema, body);
      return this.realtime.submitVote(socket, payload);
    });
  }

  @SubscribeMessage('qa:ask')
  ask(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { text } = parsePayload(qaAskSchema, body);
      return this.realtime.askQuestion(socket, text);
    });
  }

  @SubscribeMessage('qa:upvote')
  upvote(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<Ack> {
    return this.run(async () => {
      const { questionId } = parsePayload(qaUpvoteSchema, body);
      return this.realtime.upvoteQuestion(socket, questionId);
    });
  }

  /** Hataları ack'e dönüştürür; beklenmeyen hatalar genel mesajla döner ve loglanır. */
  private async run(fn: () => Promise<object>): Promise<Ack> {
    try {
      const data = await fn();
      return { ok: true, ...data };
    } catch (err) {
      if (err instanceof AppError) {
        return { ok: false, error: { code: err.code, message: err.message, details: err.details } };
      }
      this.logger.error(err instanceof Error ? err.stack : String(err));
      return { ok: false, error: { code: 'internal_error', message: 'Beklenmeyen bir hata oluştu' } };
    }
  }
}
