import { Controller, Get, Post, Put, Body, Param, Logger } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { CreateBoardDto, CreateColumnDto, CreateCardDto, MoveCardDto } from './dto/kanban.dto';

@Controller('api/kanban')
export class KanbanController {
  private readonly logger = new Logger(KanbanController.name);

  constructor(private readonly kanbanService: KanbanService) {}

  @Get('boards')
  async getAllBoards() {
    this.logger.log('GET /kanban/boards');
    const boards = await this.kanbanService.getBoards();
    return {
      success: true,
      data: boards,
      storageType: this.kanbanService.getStorageType()
    };
  }

  @Get('boards/:id')
  async getBoardById(@Param('id') id: string) {
    this.logger.log(`GET /kanban/boards/${id}`);
    const board = await this.kanbanService.getBoardById(id);
    return {
      success: true,
      data: board,
      storageType: this.kanbanService.getStorageType()
    };
  }

  @Post('boards')
  async createBoard(@Body() createBoardDto: CreateBoardDto) {
    this.logger.log('POST /kanban/boards');
    const board = await this.kanbanService.createBoard(createBoardDto);
    return {
      success: true,
      data: board
    };
  }

  @Put('boards/:boardId/move-card')
  async moveCard(@Param('boardId') boardId: string, @Body() moveCardDto: MoveCardDto) {
    this.logger.log(`PUT /kanban/boards/${boardId}/move-card`);
    const updatedBoard = await this.kanbanService.moveCard(boardId, moveCardDto);
    return {
      success: true,
      data: updatedBoard
    };
  }

  @Post('boards/:boardId/columns')
  async addColumn(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto
  ) {
    this.logger.log(`POST /kanban/boards/${boardId}/columns`);
    const updatedBoard = await this.kanbanService.addColumn(boardId, createColumnDto);
    return {
      success: true,
      data: updatedBoard
    };
  }

  @Post('boards/:boardId/columns/:columnId/cards')
  async addCard(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto
  ) {
    this.logger.log(`POST /kanban/boards/${boardId}/columns/${columnId}/cards`);
    const updatedBoard = await this.kanbanService.addCard(boardId, columnId, createCardDto);
    return {
      success: true,
      data: updatedBoard
    };
  }
}
