import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { KanbanService } from './kanban.service';
import { MoveCardDto, CreateCardDto, CreateColumnDto } from './dto/kanban.dto';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

interface JoinBoardRequest {
  boardId: string;
  userId?: string;
}

interface UpdateCardRequest {
  boardId: string;
  cardId: string;
  updates: Partial<CreateCardDto>;
}

interface DeleteCardRequest {
  boardId: string;
  cardId: string;
}

interface CreateColumnRequest {
  boardId: string;
  column: CreateColumnDto;
}

@WebSocketGateway({
  namespace: '/kanban',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class KanbanSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(KanbanSocketGateway.name);
  private readonly boardRooms = new Map<string, Set<string>>(); // boardId -> Set of socketIds

  constructor(private readonly kanbanService: KanbanService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`, 'KanbanSocketGateway');
    
    // Send connection confirmation
    client.emit('connection-status', createSocketResponse('connection-status', {
      connected: true,
      socketId: client.id,
      timestamp: new Date().toISOString()
    }));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`, 'KanbanSocketGateway');
    
    // Remove client from all board rooms
    this.boardRooms.forEach((socketIds, boardId) => {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.boardRooms.delete(boardId);
        } else {
          // Notify other clients in the room
          this.notifyBoardParticipants(boardId, 'user-left', {
            socketId: client.id,
            participantCount: socketIds.size
          });
        }
      }
    });
  }

  @SubscribeMessage('join-board')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: JoinBoardRequest
  ) {
    try {
      this.logger.log(`Client ${client.id} joining board ${data.boardId}`, 'KanbanSocketGateway');
      
      // Join the board room
      client.join(data.boardId);
      
      // Track board participants
      if (!this.boardRooms.has(data.boardId)) {
        this.boardRooms.set(data.boardId, new Set());
      }
      const boardParticipants = this.boardRooms.get(data.boardId);
      if (boardParticipants) {
        boardParticipants.add(client.id);
      }
      
      // Get initial board data
      const board = await this.kanbanService.getBoardById(data.boardId);
      
      // Send board data to the joining client
      client.emit('board-data', createSocketResponse('board-data', board));
      
      // Notify other participants
      const participantCount = boardParticipants?.size || 0;
      this.notifyBoardParticipants(data.boardId, 'user-joined', {
        socketId: client.id,
        userId: data.userId,
        participantCount
      }, client.id);
      
      return createSocketResponse('join-board-success', {
        boardId: data.boardId,
        participantCount
      });
    } catch (error) {
      this.logger.error('Error joining board', 'KanbanSocketGateway', { error, boardId: data.boardId });
      client.emit('error', createSocketResponse('error', { 
        message: 'Failed to join board',
        boardId: data.boardId 
      }));
    }
  }

  @SubscribeMessage('leave-board')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    try {
      this.logger.log(`Client ${client.id} leaving board ${data.boardId}`, 'KanbanSocketGateway');
      
      client.leave(data.boardId);
      
      // Remove from tracking
      const boardParticipants = this.boardRooms.get(data.boardId);
      if (boardParticipants) {
        boardParticipants.delete(client.id);
        
        if (boardParticipants.size === 0) {
          this.boardRooms.delete(data.boardId);
        } else {
          // Notify remaining participants
          this.notifyBoardParticipants(data.boardId, 'user-left', {
            socketId: client.id,
            participantCount: boardParticipants.size
          });
        }
      }
      
      return createSocketResponse('leave-board-success', { boardId: data.boardId });
    } catch (error) {
      this.logger.error('Error leaving board', 'KanbanSocketGateway', { error, boardId: data.boardId });
    }
  }

  @SubscribeMessage('get-boards')
  async handleGetBoards(@ConnectedSocket() client: Socket) {
    try {
      const result = await this.kanbanService.getBoardsForSocket();
      client.emit('boards-update', createSocketResponse('boards-update', result));
      this.logger.debug(`Sent boards to client ${client.id}`, 'KanbanSocketGateway');
    } catch (error) {
      this.logger.error('Error getting boards for socket', 'KanbanSocketGateway', { error });
      client.emit('error', createSocketResponse('error', { message: 'Failed to get boards' }));
    }
  }

  @SubscribeMessage('move-card')
  async handleMoveCard(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: { boardId: string; moveCard: MoveCardDto }
  ) {
    try {
      this.logger.debug(`Moving card for client ${client.id}`, 'KanbanSocketGateway', { payload });
      
      const updatedBoard = await this.kanbanService.moveCard(payload.boardId, payload.moveCard);
      
      // Broadcast to all clients in the board room
      this.server.to(payload.boardId).emit('board-updated', createSocketResponse('board-updated', {
        board: updatedBoard,
        action: 'card-moved',
        cardId: payload.moveCard.cardId,
        sourceColumn: payload.moveCard.sourceColumnId,
        targetColumn: payload.moveCard.targetColumnId,
        movedBy: client.id
      }));
      
      this.logger.log(`Card moved successfully`, 'KanbanSocketGateway', {
        boardId: payload.boardId,
        cardId: payload.moveCard.cardId
      });
      
      return createSocketResponse('move-card-success', { 
        cardId: payload.moveCard.cardId,
        boardId: payload.boardId 
      });
    } catch (error) {
      this.logger.error('Error moving card', 'KanbanSocketGateway', { error, payload });
      client.emit('error', createSocketResponse('error', { message: 'Failed to move card' }));
    }
  }

  @SubscribeMessage('create-card')
  async handleCreateCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; columnId: string; card: CreateCardDto }
  ) {
    try {
      this.logger.debug(`Creating card for client ${client.id}`, 'KanbanSocketGateway', { data });
      
      const updatedBoard = await this.kanbanService.createCard(data.boardId, data.columnId, data.card);
      
      // Broadcast to all clients in the board room
      this.server.to(data.boardId).emit('board-updated', createSocketResponse('board-updated', {
        board: updatedBoard,
        action: 'card-created',
        columnId: data.columnId,
        createdBy: client.id
      }));
      
      return createSocketResponse('create-card-success', { 
        boardId: data.boardId,
        columnId: data.columnId 
      });
    } catch (error) {
      this.logger.error('Error creating card', 'KanbanSocketGateway', { error, data });
      client.emit('error', createSocketResponse('error', { message: 'Failed to create card' }));
    }
  }

  @SubscribeMessage('update-card')
  async handleUpdateCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateCardRequest
  ) {
    try {
      this.logger.debug(`Updating card for client ${client.id}`, 'KanbanSocketGateway', { data });
      
      const updatedBoard = await this.kanbanService.updateCard(data.boardId, data.cardId, data.updates);
      
      // Broadcast to all clients in the board room
      this.server.to(data.boardId).emit('board-updated', createSocketResponse('board-updated', {
        board: updatedBoard,
        action: 'card-updated',
        cardId: data.cardId,
        updatedBy: client.id
      }));
      
      return createSocketResponse('update-card-success', { 
        boardId: data.boardId,
        cardId: data.cardId 
      });
    } catch (error) {
      this.logger.error('Error updating card', 'KanbanSocketGateway', { error, data });
      client.emit('error', createSocketResponse('error', { message: 'Failed to update card' }));
    }
  }

  @SubscribeMessage('delete-card')
  async handleDeleteCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DeleteCardRequest
  ) {
    try {
      this.logger.debug(`Deleting card for client ${client.id}`, 'KanbanSocketGateway', { data });
      
      const updatedBoard = await this.kanbanService.deleteCard(data.boardId, data.cardId);
      
      // Broadcast to all clients in the board room
      this.server.to(data.boardId).emit('board-updated', createSocketResponse('board-updated', {
        board: updatedBoard,
        action: 'card-deleted',
        cardId: data.cardId,
        deletedBy: client.id
      }));
      
      return createSocketResponse('delete-card-success', { 
        boardId: data.boardId,
        cardId: data.cardId 
      });
    } catch (error) {
      this.logger.error('Error deleting card', 'KanbanSocketGateway', { error, data });
      client.emit('error', createSocketResponse('error', { message: 'Failed to delete card' }));
    }
  }

  @SubscribeMessage('create-column')
  async handleCreateColumn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateColumnRequest
  ) {
    try {
      this.logger.debug(`Creating column for client ${client.id}`, 'KanbanSocketGateway', { data });
      
      const updatedBoard = await this.kanbanService.createColumn(data.boardId, data.column);
      
      // Broadcast to all clients in the board room
      this.server.to(data.boardId).emit('board-updated', createSocketResponse('board-updated', {
        board: updatedBoard,
        action: 'column-created',
        createdBy: client.id
      }));
      
      return createSocketResponse('create-column-success', { 
        boardId: data.boardId 
      });
    } catch (error) {
      this.logger.error('Error creating column', 'KanbanSocketGateway', { error, data });
      client.emit('error', createSocketResponse('error', { message: 'Failed to create column' }));
    }
  }

  @SubscribeMessage('get-board-participants')
  handleGetBoardParticipants(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    const participants = this.boardRooms.get(data.boardId);
    const participantCount = participants ? participants.size : 0;
    
    client.emit('board-participants', createSocketResponse('board-participants', {
      boardId: data.boardId,
      participantCount,
      participants: participants ? Array.from(participants) : []
    }));
  }

  /**
   * Notify all participants in a board except the sender
   */
  private notifyBoardParticipants(
    boardId: string, 
    eventType: string, 
    data: Record<string, unknown>, 
    excludeSocketId?: string
  ) {
    const participants = this.boardRooms.get(boardId);
    if (!participants) return;

    participants.forEach(socketId => {
      if (socketId !== excludeSocketId) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(eventType, createSocketResponse(eventType, data));
        }
      }
    });
  }
}
