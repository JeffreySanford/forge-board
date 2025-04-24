import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { KablanService } from './kablan.service';
import { CreateBoardDto, CreateCardDto, CreateColumnDto, MoveCardDto } from './dto/kablan.dto';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

@WebSocketGateway({
  namespace: '/kablan',
  cors: {
    origin: '*',
  },
})
export class KablanGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(KablanGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly kablanService: KablanService) {}

  afterInit(server: Server): void {
    this.logger.log('Kablan Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('get-boards')
  async getAllBoards(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const boards = await this.kablanService.getBoards();
      client.emit('boards-update', {
        status: 'success',
        data: boards
      } as SocketResponse<any>);
    } catch (error) {
      this.logger.error(`Error fetching boards: ${error.message}`, error.stack);
      client.emit('boards-update', {
        status: 'error',
        message: 'Failed to fetch boards'
      } as SocketResponse<any>);
    }
  }

  @SubscribeMessage('create-board')
  async createBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() createBoardDto: CreateBoardDto
  ): Promise<void> {
    try {
      await this.kablanService.createBoard(createBoardDto);
      const boards = await this.kablanService.getBoards();
      this.server.emit('boards-update', {
        status: 'success',
        data: boards
      } as SocketResponse<any>);
    } catch (error) {
      this.logger.error(`Error creating board: ${error.message}`, error.stack);
      client.emit('error', {
        status: 'error',
        message: 'Failed to create board'
      } as SocketResponse<any>);
    }
  }

  @SubscribeMessage('add-column')
  async addColumn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; column: CreateColumnDto }
  ): Promise<void> {
    try {
      await this.kablanService.addColumnToBoard(payload.boardId, payload.column);
      const boards = await this.kablanService.getBoards();
      this.server.emit('boards-update', {
        status: 'success',
        data: boards
      } as SocketResponse<any>);
    } catch (error) {
      this.logger.error(`Error adding column: ${error.message}`, error.stack);
      client.emit('error', {
        status: 'error',
        message: 'Failed to add column'
      } as SocketResponse<any>);
    }
  }

  @SubscribeMessage('add-card')
  async addCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; columnId: string; card: CreateCardDto }
  ): Promise<void> {
    try {
      await this.kablanService.addCardToColumn(payload.boardId, payload.columnId, payload.card);
      const boards = await this.kablanService.getBoards();
      this.server.emit('boards-update', {
        status: 'success',
        data: boards
      } as SocketResponse<any>);
    } catch (error) {
      this.logger.error(`Error adding card: ${error.message}`, error.stack);
      client.emit('error', {
        status: 'error',
        message: 'Failed to add card'
      } as SocketResponse<any>);
    }
  }

  @SubscribeMessage('move-card')
  async moveCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; moveCard: MoveCardDto }
  ): Promise<void> {
    try {
      await this.kablanService.moveCard(payload.boardId, payload.moveCard);
      const boards = await this.kablanService.getBoards();
      this.server.emit('boards-update', {
        status: 'success',
        data: boards
      } as SocketResponse<any>);
    } catch (error) {
      this.logger.error(`Error moving card: ${error.message}`, error.stack);
      client.emit('error', {
        status: 'error',
        message: 'Failed to move card'
      } as SocketResponse<any>);
    }
  }
}
