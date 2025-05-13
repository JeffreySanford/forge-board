import { Controller, Get, Post, Body, Param, Put, Logger } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { CreateBoardDto, CreateColumnDto, CreateCardDto, MoveCardDto } from './dto/kanban.dto';

@Controller('kanban')
export class KanbanController {
  private readonly logger = new Logger(KanbanController.name);

  constructor(private readonly kanbanService: KanbanService) {}

  @Get('status')
  getStatus(): { status: string; storageType: string } {
    return { 
      status: 'ok',
      storageType: this.kanbanService.getStorageType() 
    };
  }

  @Get('boards')
  async getAllBoards() {
    this.logger.log('GET /kanban/boards');
    return this.kanbanService.getBoards();
  }

  @Get('boards/:id')
  async getBoardById(@Param('id') id: string) {
    this.logger.log(`GET /kanban/boards/${id}`);
    return this.kanbanService.getBoardById(id);
  }

  @Post('boards')
  async createBoard(@Body() createBoardDto: CreateBoardDto) {
    this.logger.log('POST /kanban/boards');
    return this.kanbanService.createBoard(createBoardDto);
  }

  @Post('boards/:boardId/columns')
  async addColumn(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto
  ) {
    this.logger.log(`POST /kanban/boards/${boardId}/columns`);
    return this.kanbanService.addColumn(boardId, createColumnDto);
  }

  @Post('boards/:boardId/columns/:columnId/cards')
  async addCard(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto
  ) {
    this.logger.log(`POST /kanban/boards/${boardId}/columns/${columnId}/cards`);
    return this.kanbanService.addCard(boardId, columnId, createCardDto);
  }

  @Put('boards/:boardId/cards/move')
  async moveCard(
    @Param('boardId') boardId: string,
    @Body() moveCardDto: MoveCardDto
  ) {
    this.logger.log(`PUT /kanban/boards/${boardId}/cards/move`);
    return this.kanbanService.moveCard(boardId, moveCardDto);
  }
}
