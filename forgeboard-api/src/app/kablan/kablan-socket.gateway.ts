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
import { KablanService } from './kablan.service';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';
import { MoveCardDto } from './dto/kablan.dto';
import { LoggerService } from '../logger/logger.service';
import { Injectable } from '@nestjs/common';

// Define proper types to replace 'any'
interface MoveCardPayload {
  boardId: string;
  moveCard: {
    cardId: string;
    sourceColumnId: string;
    targetColumnId: string;
    newIndex: number;
  };
}

@Injectable()
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

  constructor(
    private readonly kablanService: KablanService,
    private readonly logger: LoggerService
  ) {}

  afterInit(server: Server): void {
    this.logger.info('Kablan WebSocket Gateway Initialized', 'KablanSocketGateway');
    this.logger.info(`Server namespace: ${server.path() || '/kablan'}`, 'KablanSocketGateway');
  }

  handleConnection(client: Socket): void {
    this.logger.info(`Client connected to kablan namespace: ${client.id}`, 'KablanSocketGateway', { clientId: client.id });
    
    // Send initial data when client connects
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.info(`Client disconnected from kablan namespace: ${client.id}`, 'KablanSocketGateway', { clientId: client.id });
  }

  private async sendInitialData(client: Socket): Promise<void> {
    try {
      const boards = await this.kablanService.getBoards();
      const storageType = this.kablanService.getStorageType();
      
      this.logger.info(`Sending initial data to client ${client.id} with storage type: ${storageType}`, 'KablanSocketGateway', { 
        clientId: client.id, 
        storageType, 
        boardCount: boards.length 
      });
      
      // Also send storage type info with the boards
      client.emit('boards-update', createSocketResponse('boards-update', {
        boards,
        storageType: storageType
      }));
    } catch (error) {
      this.logger.error('Error sending initial data:', 'KablanSocketGateway', { 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        clientId: client.id
      });
    }
  }

  @SubscribeMessage('get-boards')
  async handleGetBoards(client: Socket): Promise<WsResponse<unknown>> {
    this.logger.info(`Client ${client.id} requested boards`, 'KablanSocketGateway', { clientId: client.id });
    try {
      const boards = await this.kablanService.getBoards();
      const storageType = this.kablanService.getStorageType();
      
      this.logger.info(`Sending boards to client ${client.id} with storage type: ${storageType}`, 'KablanSocketGateway', {
        clientId: client.id,
        storageType,
        boardCount: boards.length
      });
      
      return { 
        event: 'boards-update', 
        data: createSocketResponse('boards-update', {
          boards,
          storageType: storageType
        })
      };
    } catch (error) {
      this.logger.error(`Error retrieving boards:`, 'KablanSocketGateway', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        clientId: client.id
      });
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
  async handleMoveCard(client: Socket, payload: MoveCardPayload): Promise<WsResponse<unknown>> {
    this.logger.info(`Client ${client.id} moving card`, 'KablanSocketGateway', { 
      clientId: client.id, 
      boardId: payload.boardId,
      cardId: payload.moveCard.cardId,
      sourceColumnId: payload.moveCard.sourceColumnId,
      targetColumnId: payload.moveCard.targetColumnId,
      newIndex: payload.moveCard.newIndex
    });
    
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
      
      this.logger.info(`Card moved successfully`, 'KablanSocketGateway', {
        boardId,
        cardId,
        sourceColumnId,
        targetColumnId,
        targetIndex: newIndex,
        clientId: client.id
      });
      
      return {
        event: 'move-card-success',
        data: createSocketResponse('move-card-success', { success: true })
      };
    } catch (error) {
      this.logger.error(`Error moving card:`, 'KablanSocketGateway', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        clientId: client.id,
        payload
      });
      return {
        event: 'error',
        data: createSocketResponse('error', {
          message: 'Failed to move card',
          error: error instanceof Error ? error.message : String(error)
        })
      };
    }
  }
}
