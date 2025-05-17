import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KanbanService } from './kanban.service';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';
import { MoveCardDto } from './dto/kanban.dto';
import { LoggerService } from '../logger/logger.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subscription } from 'rxjs';

@Injectable()
@WebSocketGateway({
  namespace: '/kanban',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
})
export class KanbanSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server: Server;
  private boardsSub: Subscription;

  constructor(
    private readonly kanbanService: KanbanService,
    private readonly logger: LoggerService
  ) {}

  onModuleInit() {
    // Subscribe to board changes and broadcast to all clients
    this.boardsSub = this.kanbanService.getBoards$().subscribe(boards => {
      this.server.emit('boards-update', createSocketResponse('boards-update', {
        boards,
        storageType: this.kanbanService.getStorageType()
      }));
    });
  }

  afterInit(server: Server): void {
    this.logger.info('Kanban WebSocket Gateway Initialized', 'KanbanSocketGateway');
  }

  handleConnection(client: Socket): void {
    this.logger.info(`Client connected to kanban namespace: ${client.id}`, 'KanbanSocketGateway', { clientId: client.id });
    client.emit('connection-status', { status: 'success', data: { connected: true }, timestamp: new Date().toISOString() });
    // Send current boards state
    client.emit('boards-update', createSocketResponse('boards-update', {
      boards: this.kanbanService.getBoardsValue(),
      storageType: this.kanbanService.getStorageType()
    }));
  }

  handleDisconnect(client: Socket): void {
    this.logger.info(`Client disconnected from kanban namespace: ${client.id}`, 'KanbanSocketGateway', { clientId: client.id });
  }

  @SubscribeMessage('get-boards')
  handleGetBoards(client: Socket): void {
    // No-op: boards-update is pushed reactively
  }

  @SubscribeMessage('move-card')
  handleMoveCard(client: Socket, payload: { boardId: string, moveCard: { cardId: string, sourceColumnId: string, targetColumnId: string, newIndex: number } }): void {
    const { boardId, moveCard } = payload;
    const moveCardDto: MoveCardDto = {
      cardId: moveCard.cardId,
      sourceColumnId: moveCard.sourceColumnId,
      targetColumnId: moveCard.targetColumnId,
      sourceIndex: -1,
      targetIndex: moveCard.newIndex
    };
    this.kanbanService.moveCard(boardId, moveCardDto);
  }
}
