import { Injectable, NotFoundException } from '@nestjs/common';
import { KanbanBoardDto, CardDto, ColumnDto, CreateBoardDto, CreateColumnDto, CreateCardDto, MoveCardDto } from './dto/kanban.dto';
import { LoggerService } from '../logger/logger.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KanbanService {
  private readonly logger: LoggerService;
  private readonly boards$ = new BehaviorSubject<KanbanBoardDto[]>([]);
  // Use 'in-memory' to match frontend expectations
  private readonly storageType$ = new BehaviorSubject<string>('in-memory');

  constructor(logger: LoggerService) {
    this.logger = logger;
    // Optionally, initialize with mock data or load from persistent storage
    this.boards$.next([]);
    // Optionally, ensure storageType is always correct
    this.storageType$.next('in-memory');
  }

  getBoards$(): Observable<KanbanBoardDto[]> {
    return this.boards$.asObservable();
  }

  getStorageType$(): Observable<string> {
    return this.storageType$.asObservable();
  }

  getStorageType(): string {
    return this.storageType$.value;
  }

  setStorageType(type: string): void {
    // Only allow 'in-memory' for now
    this.storageType$.next('in-memory');
    this.logger.info(`Storage type set to: in-memory`, 'KanbanService');
  }

  checkStorageConnection(): Observable<boolean> {
    // Always "connected" for in-memory
    return of(true);
  }

  getBoardById$(id: string): Observable<KanbanBoardDto> {
    return new BehaviorSubject(this.findBoardOrThrow(id)).asObservable();
  }

  createBoard(createBoardDto: CreateBoardDto): void {
    const now = new Date().toISOString();
    const newBoard: KanbanBoardDto = {
      id: uuidv4(),
      name: createBoardDto.name,
      columns: [],
      createdAt: now,
      updatedAt: now
    };
    const boards = [...this.boards$.value, newBoard];
    this.boards$.next(boards);
    this.logger.info(`Board created: ${newBoard.name}`, 'KanbanService');
  }

  addColumn(boardId: string, createColumnDto: CreateColumnDto): void {
    const boards = this.boards$.value.map(board => {
      if (board.id !== boardId) return board;
      const newColumn: ColumnDto = {
        id: uuidv4(),
        name: createColumnDto.name,
        order: createColumnDto.order || board.columns.length,
        phase: createColumnDto.phase,
        cards: []
      };
      return {
        ...board,
        columns: [...board.columns, newColumn],
        updatedAt: new Date().toISOString()
      };
    });
    this.boards$.next(boards);
    this.logger.info(`Column added to board ${boardId}: ${createColumnDto.name}`, 'KanbanService');
  }

  addCard(boardId: string, columnId: string, createCardDto: CreateCardDto): void {
    const boards = this.boards$.value.map(board => {
      if (board.id !== boardId) return board;
      const columns = board.columns.map(col => {
        if (col.id !== columnId) return col;
        const now = new Date().toISOString();
        const newCard: CardDto = {
          id: uuidv4(),
          title: createCardDto.title,
          description: createCardDto.description,
          priority: createCardDto.priority || 'medium',
          tags: createCardDto.tags || [],
          assignee: createCardDto.assignee,
          createdAt: now,
          updatedAt: now
        };
        return { ...col, cards: [...col.cards, newCard] };
      });
      return { ...board, columns, updatedAt: new Date().toISOString() };
    });
    this.boards$.next(boards);
    this.logger.info(`Card added to board ${boardId}, column ${columnId}: ${createCardDto.title}`, 'KanbanService');
  }

  moveCard(boardId: string, moveCardDto: MoveCardDto): void {
    const { cardId, sourceColumnId, targetColumnId, sourceIndex, targetIndex } = moveCardDto;
    const boards = this.boards$.value.map(board => {
      if (board.id !== boardId) return board;
      let cardToMove: CardDto | undefined;
      const columns = board.columns.map(col => {
        if (col.id === sourceColumnId) {
          const idx = sourceIndex !== undefined && sourceIndex >= 0
            ? sourceIndex
            : col.cards.findIndex(card => card.id === cardId);
          if (idx === -1) throw new NotFoundException(`Card with ID "${cardId}" not found`);
          [cardToMove] = col.cards.splice(idx, 1);
          return { ...col, cards: [...col.cards] };
        }
        return col;
      }).map(col => {
        if (col.id === targetColumnId && cardToMove) {
          col.cards.splice(targetIndex, 0, { ...cardToMove, updatedAt: new Date().toISOString() });
        }
        return col;
      });
      return { ...board, columns, updatedAt: new Date().toISOString() };
    });
    this.boards$.next(boards);
    this.logger.info(`Card moved in board ${boardId}: ${cardId} from ${sourceColumnId} to ${targetColumnId}`, 'KanbanService');
  }

  getBoardsValue(): KanbanBoardDto[] {
    return this.boards$.value;
  }

  // Helper
  private findBoardOrThrow(id: string): KanbanBoardDto {
    const board = this.boards$.value.find(b => b.id === id);
    if (!board) throw new NotFoundException(`Board with ID "${id}" not found`);
    return board;
  }
}
