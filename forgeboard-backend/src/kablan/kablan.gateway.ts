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
import { Logger } from '@nestjs/common';
import { KablanService } from './kablan.service';
import { SocketRegistryService } from '../app/socket-registry/socket-registry.service';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

@WebSocketGateway({ 
  namespace: 'kablan',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
})
export class KablanGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(KablanGateway.name);

  constructor(
    private kablanService: KablanService,
    private socketRegistry: SocketRegistryService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log('Kablan WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.socketRegistry.registerSocket(client);
    
    // Send initial boards data to the connected client
    this.kablanService.getBoards().then(boards => {
      client.emit('boards', createSocketResponse('boards', boards));
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.socketRegistry.unregisterSocket(client.id);
  }

  @SubscribeMessage('getBoards')
  async handleGetBoards(client: Socket): Promise<WsResponse<any>> {
    const boards = await this.kablanService.getBoards();
    return { event: 'boards', data: createSocketResponse('boards', boards) };
  }

  @SubscribeMessage('getBoard')
  async handleGetBoard(client: Socket, boardId: string): Promise<WsResponse<any>> {
    try {
      const board = await this.kablanService.getBoardById(boardId);
      return { event: 'board', data: createSocketResponse('board', board) };
    } catch (error) {
      this.logger.error(`Error getting board ${boardId}:`, error);
      return { 
        event: 'error', 
        data: { 
          status: 'error', 
          message: 'Board not found', 
          timestamp: new Date().toISOString() 
        }
      };
    }
  }

  @SubscribeMessage('moveCard')
  async handleMoveCard(client: Socket, payload: any): Promise<WsResponse<any>> {
    try {
      const updatedBoard = await this.kablanService.moveCard(payload.boardId, payload);
      // Broadcast to all clients in the namespace
      this.server.emit('boardUpdated', createSocketResponse('boardUpdated', updatedBoard));
      return { event: 'moveCardSuccess', data: createSocketResponse('moveCardSuccess', true) };
    } catch (error) {
      this.logger.error('Error moving card:', error);
      return { 
        event: 'error', 
        data: { 
          status: 'error', 
          message: 'Failed to move card', 
          timestamp: new Date().toISOString() 
        }
      };
    }
  }
}
