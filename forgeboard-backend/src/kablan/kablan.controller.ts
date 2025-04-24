import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put,
  Logger
} from '@nestjs/common';
import { KablanService } from './kablan.service';
import { 
  CreateBoardDto, 
  CreateCardDto, 
  CreateColumnDto, 
  KablanBoardDto, 
  MoveCardDto 
} from './dto/kablan.dto';

@Controller('kablan')
export class KablanController {
  private readonly logger = new Logger(KablanController.name);

  constructor(private readonly kablanService: KablanService) {}

  @Get('status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }

  @Get('boards')
  async getAllBoards(): Promise<KablanBoardDto[]> {
    this.logger.log('GET /kablan/boards');
    return this.kablanService.getBoards();
  }

  @Get('boards/:id')
  async getBoardById(@Param('id') id: string): Promise<KablanBoardDto> {
    this.logger.log(`GET /kablan/boards/${id}`);
    return this.kablanService.getBoardById(id);
  }

  @Post('boards')
  async createBoard(@Body() createBoardDto: CreateBoardDto): Promise<KablanBoardDto> {
    this.logger.log('POST /kablan/boards', createBoardDto);
    return this.kablanService.createBoard(createBoardDto);
  }

  @Post('boards/:boardId/columns')
  async addColumn(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto
  ): Promise<KablanBoardDto> {
    this.logger.log(`POST /kablan/boards/${boardId}/columns`, createColumnDto);
    return this.kablanService.addColumnToBoard(boardId, createColumnDto);
  }

  @Post('boards/:boardId/columns/:columnId/cards')
  async addCard(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto
  ): Promise<KablanBoardDto> {
    this.logger.log(`POST /kablan/boards/${boardId}/columns/${columnId}/cards`, createCardDto);
    return this.kablanService.addCardToColumn(boardId, columnId, createCardDto);
  }

  @Put('boards/:boardId/cards/move')
  async moveCard(
    @Param('boardId') boardId: string,
    @Body() moveCardDto: MoveCardDto
  ): Promise<KablanBoardDto> {
    this.logger.log(`PUT /kablan/boards/${boardId}/cards/move`, moveCardDto);
    return this.kablanService.moveCard(boardId, moveCardDto);
  }
}
