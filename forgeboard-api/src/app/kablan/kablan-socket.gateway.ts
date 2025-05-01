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
import { createSocketResponse } from '@forge-board/shared/api-interfaces';
import { MoveCardDto } from './dto/kablan.dto';

@WebSocketGateway({
  namespace: 'kablan',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
})
export class KablanSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(KablanSocketGateway.name);

  constructor(private readonly kablanService: KablanService) {}

  afterInit(server: Server): void {
    this.logger.log('Kablan WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected to kablan namespace: ${client.id}`);
    
    // Send initial data when client connects
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from kablan namespace: ${client.id}`);
  }

  private async sendInitialData(client: Socket): Promise<void> {
    try {
      const boards = await this.kablanService.getBoards();
      
      // Also send storage type info with the boards
      client.emit('boards-update', createSocketResponse('boards-update', {
        boards,
        storageType: this.kablanService.getStorageType()
      }));
    } catch (error) {
      this.logger.error('Error sending initial data:', error);
    }
  }

  @SubscribeMessage('get-boards')
  async handleGetBoards(client: Socket): Promise<WsResponse<any>> {
    this.logger.log(`Client ${client.id} requested boards`);
    try {
      const boards = await this.kablanService.getBoards();
      return { 
        event: 'boards-update', 
        data: createSocketResponse('boards-update', {
          boards,
          storageType: this.kablanService.getStorageType()
        })
      };
    } catch (error) {
      this.logger.error(`Error retrieving boards:`, error);
      return { 
        event: 'error', 
        data: { 
          status: 'error', 
          message: 'Failed to retrieve boards',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @SubscribeMessage('move-card')
  async handleMoveCard(client: Socket, payload: any): Promise<WsResponse<any>> {
    this.logger.log(`Client ${client.id} moving card: ${JSON.stringify(payload)}`);
    try {
      const { boardId, moveCard } = payload;
      const { cardId, sourceColumnId, targetColumnId, newIndex } = moveCard;
      
      const moveCardDto: MoveCardDto = {
        cardId,
        sourceColumnId, 
        targetColumnId,
        sourceIndex: -1, // The service will find the card's actual index
        targetIndex: newIndex
      };
      
      // Call service method to update the board
      const updatedBoard = await this.kablanService.moveCard(boardId, moveCardDto);
      
      // Broadcast to all clients
      this.server.emit('boards-update', createSocketResponse('boards-update', {
        boards: [updatedBoard],
        storageType: this.kablanService.getStorageType()
      }));
      
      return {
        event: 'move-card-success',
        data: createSocketResponse('move-card-success', { success: true })
      };
    } catch (error) {
      this.logger.error(`Error moving card:`, error);
      return {
        event: 'error',
        data: createSocketResponse('error', {
          message: 'Failed to move card',
          error: error.message
        })
      };
    }
  }
}
