import { Controller, Get, Post, Body, Param, Put, Logger } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { CreateBoardDto, CreateColumnDto, CreateCardDto, MoveCardDto } from './dto/kanban.dto';
import { Observable } from 'rxjs';

@Controller('kanban')
export class KanbanController {
  private readonly logger = new Logger(KanbanController.name);

  constructor(private readonly kanbanService: KanbanService) {}

  @Get('status')
  getStatus(): Observable<{ status: string; storageType: string; connected: boolean }> {
    return new Observable(subscriber => {
      this.kanbanService.checkStorageConnection().subscribe(connected => {
        subscriber.next({
          status: connected ? 'ok' : 'disconnected',
          storageType: this.kanbanService.getStorageType(),
          connected
        });
        subscriber.complete();
      });
    });
  }

  @Get('boards')
  getAllBoards(): Observable<unknown> {
    return this.kanbanService.getBoards$();
  }

  @Get('boards/:id')
  getBoardById(@Param('id') id: string): Observable<unknown> {
    return this.kanbanService.getBoardById$(id);
  }

  @Post('boards')
  createBoard(@Body() createBoardDto: CreateBoardDto): Observable<{ success: boolean }> {
    this.kanbanService.createBoard(createBoardDto);
    return new Observable(sub => { sub.next({ success: true }); sub.complete(); });
  }

  @Post('boards/:boardId/columns')
  addColumn(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto
  ): Observable<{ success: boolean }> {
    this.kanbanService.addColumn(boardId, createColumnDto);
    return new Observable(sub => { sub.next({ success: true }); sub.complete(); });
  }

  @Post('boards/:boardId/columns/:columnId/cards')
  addCard(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto
  ): Observable<{ success: boolean }> {
    this.kanbanService.addCard(boardId, columnId, createCardDto);
    return new Observable(sub => { sub.next({ success: true }); sub.complete(); });
  }

  @Put('boards/:boardId/cards/move')
  moveCard(
    @Param('boardId') boardId: string,
    @Body() moveCardDto: MoveCardDto
  ): Observable<{ success: boolean }> {
    this.kanbanService.moveCard(boardId, moveCardDto);
    return new Observable(sub => { sub.next({ success: true }); sub.complete(); });
  }
}
