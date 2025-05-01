import { Controller, Get, Post, Body, Param, Put, Logger } from '@nestjs/common';
import { KablanService } from './kablan.service';
import { CreateBoardDto, CreateColumnDto, CreateCardDto, MoveCardDto } from './dto/kablan.dto';

@Controller('kablan')
export class KablanController {
  private readonly logger = new Logger(KablanController.name);

  constructor(private readonly kablanService: KablanService) {}

  @Get('status')
  getStatus(): { status: string; storageType: string } {
    return { 
      status: 'ok',
      storageType: this.kablanService.getStorageType() 
    };
  }

  @Get('boards')
  async getAllBoards() {
    this.logger.log('GET /kablan/boards');
    return this.kablanService.getBoards();
  }

  @Get('boards/:id')
  async getBoardById(@Param('id') id: string) {
    this.logger.log(`GET /kablan/boards/${id}`);
    return this.kablanService.getBoardById(id);
  }

  @Post('boards')
  async createBoard(@Body() createBoardDto: CreateBoardDto) {
    this.logger.log('POST /kablan/boards');
    return this.kablanService.createBoard(createBoardDto);
  }

  @Post('boards/:boardId/columns')
  async addColumn(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto
  ) {
    this.logger.log(`POST /kablan/boards/${boardId}/columns`);
    return this.kablanService.addColumn(boardId, createColumnDto);
  }

  @Post('boards/:boardId/columns/:columnId/cards')
  async addCard(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto
  ) {
    this.logger.log(`POST /kablan/boards/${boardId}/columns/${columnId}/cards`);
    return this.kablanService.addCard(boardId, columnId, createCardDto);
  }

  @Put('boards/:boardId/cards/move')
  async moveCard(
    @Param('boardId') boardId: string,
    @Body() moveCardDto: MoveCardDto
  ) {
    this.logger.log(`PUT /kablan/boards/${boardId}/cards/move`);
    return this.kablanService.moveCard(boardId, moveCardDto);
  }
}
