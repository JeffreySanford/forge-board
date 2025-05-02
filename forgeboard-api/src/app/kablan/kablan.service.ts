import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  KablanBoardDto, 
  CardDto, 
  ColumnDto, 
  CreateBoardDto, 
  CreateColumnDto, 
  CreateCardDto, 
  MoveCardDto,
} from './dto/kablan.dto';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class KablanService {
  // Storage type - can be changed to reflect different backends
  private storageType: 'memory' | 'localStorage' | 'mongodb' | 'blockchain' = 'memory';
  
  // In-memory storage since we're not using MongoDB in the API version
  private boards: KablanBoardDto[] = [
    {
      id: '1',
      name: 'Planning Board',
      currentPhase: 'planning',
      phases: {
        inception: {
          active: true,
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          completionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planning: {
          active: true,
          startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        design: {
          active: false,
        },
        development: {
          active: false,
        },
        testing: {
          active: false,
        },
        completion: {
          active: false,
        }
      },
      columns: [
        {
          id: 'col1',
          name: 'Backlog',
          order: 0,
          phase: 'planning',
          cards: [
            {
              id: 'card1',
              title: 'Create API documentation',
              description: 'Write comprehensive API docs for all endpoints',
              priority: 'medium',
              tags: ['documentation', 'api'],
              assignee: 'John Doe',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'col2',
          name: 'In Progress',
          order: 1,
          phase: 'planning',
          cards: []
        },
        {
          id: 'col3',
          name: 'Done',
          order: 2,
          phase: 'planning',
          cards: []
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  constructor(private readonly logger: LoggerService) {}

  // Get the current storage type
  getStorageType(): string {
    this.logger.info(`Getting storage type: ${this.storageType}`, 'KablanService', { storageType: this.storageType });
    return this.storageType;
  }

  // Check storage connection
  checkStorageConnection(): boolean {
    // This could be expanded to check MongoDB connection if that backend is used
    this.logger.info(`Checking storage connection for type: ${this.storageType}`, 'KablanService', { storageType: this.storageType });
    return true;
  }

  // Get all boards
  async getBoards(): Promise<KablanBoardDto[]> {
    this.logger.info(`Getting boards from ${this.storageType} storage`, 'KablanService', { 
      storageType: this.storageType,
      boardCount: this.boards.length 
    });
    return this.boards;
  }

  // Get a specific board by ID
  async getBoardById(id: string): Promise<KablanBoardDto> {
    this.logger.debug(`Looking for board with ID: ${id}`, 'KablanService', { boardId: id });
    
    const board = this.boards.find(b => b.id === id);
    if (!board) {
      this.logger.warning(`Board with ID "${id}" not found`, 'KablanService', { boardId: id });
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }
    
    this.logger.debug(`Found board: ${board.name}`, 'KablanService', { 
      boardId: id, 
      boardName: board.name 
    });
    return board;
  }

  // Create a new board
  async createBoard(createBoardDto: CreateBoardDto): Promise<KablanBoardDto> {
    this.logger.info(`Creating new board: ${createBoardDto.name}`, 'KablanService', { 
      boardName: createBoardDto.name 
    });
    
    const newBoard: KablanBoardDto = {
      id: uuidv4(),
      name: createBoardDto.name,
      columns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.boards.push(newBoard);
    
    this.logger.info(`Board created with ID: ${newBoard.id}`, 'KablanService', { 
      boardId: newBoard.id, 
      boardName: newBoard.name 
    });
    return newBoard;
  }

  // Add a column to a board
  async addColumn(boardId: string, createColumnDto: CreateColumnDto): Promise<KablanBoardDto> {
    this.logger.info(`Adding column to board ${boardId}`, 'KablanService', { 
      boardId, 
      columnName: createColumnDto.name 
    });
    
    const board = await this.getBoardById(boardId);
    
    const newColumn: ColumnDto = {
      id: uuidv4(),
      name: createColumnDto.name,
      order: createColumnDto.order || board.columns.length,
      phase: createColumnDto.phase,
      cards: []
    };
    
    board.columns.push(newColumn);
    board.updatedAt = new Date().toISOString();
    
    this.logger.info(`Column ${newColumn.name} added with ID ${newColumn.id}`, 'KablanService', {
      boardId,
      columnId: newColumn.id,
      columnName: newColumn.name
    });
    
    return board;
  }

  // Add a card to a column
  async addCard(boardId: string, columnId: string, createCardDto: CreateCardDto): Promise<KablanBoardDto> {
    this.logger.info(`Adding card to column ${columnId} in board ${boardId}`, 'KablanService', {
      boardId,
      columnId,
      cardTitle: createCardDto.title
    });
    
    const board = await this.getBoardById(boardId);
    
    const column = board.columns.find(col => col.id === columnId);
    if (!column) {
      this.logger.warning(`Column with ID "${columnId}" not found`, 'KablanService', { 
        boardId, 
        columnId 
      });
      throw new NotFoundException(`Column with ID "${columnId}" not found`);
    }
    
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
    
    column.cards.push(newCard);
    board.updatedAt = now;
    
    this.logger.info(`Card "${newCard.title}" added with ID ${newCard.id}`, 'KablanService', {
      boardId,
      columnId,
      cardId: newCard.id,
      cardTitle: newCard.title
    });
    
    return board;
  }

  // Move a card within a board
  async moveCard(boardId: string, moveCardDto: MoveCardDto): Promise<KablanBoardDto> {
    const { cardId, sourceColumnId, targetColumnId, sourceIndex, targetIndex } = moveCardDto;
    
    this.logger.info(`Moving card ${cardId} from column ${sourceColumnId} to ${targetColumnId}`, 'KablanService', {
      boardId,
      cardId,
      sourceColumnId,
      targetColumnId,
      sourceIndex,
      targetIndex
    });
    
    // Find the board
    const boardIndex = this.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) {
      this.logger.warning(`Board with ID "${boardId}" not found`, 'KablanService', { boardId });
      throw new NotFoundException(`Board with ID "${boardId}" not found`);
    }
    
    // Create a deep copy to avoid mutating the original
    const board = JSON.parse(JSON.stringify(this.boards[boardIndex])) as KablanBoardDto;
    
    // Find source column
    const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
    if (!sourceColumn) {
      this.logger.warning(`Column with ID "${sourceColumnId}" not found`, 'KablanService', { 
        boardId, 
        sourceColumnId 
      });
      throw new NotFoundException(`Column with ID "${sourceColumnId}" not found`);
    }
    
    // Find card index in source column if not provided
    const actualSourceIndex = sourceIndex >= 0 ? sourceIndex : 
      sourceColumn.cards.findIndex(card => card.id === cardId);
    
    if (actualSourceIndex === -1) {
      this.logger.warning(`Card with ID "${cardId}" not found in source column`, 'KablanService', {
        boardId,
        sourceColumnId,
        cardId
      });
      throw new NotFoundException(`Card with ID "${cardId}" not found in source column`);
    }
    
    // Get the card to move
    const [cardToMove] = sourceColumn.cards.splice(actualSourceIndex, 1);
    
    // Update the card's timestamp
    cardToMove.updatedAt = new Date().toISOString();
    
    // If moving to same column
    if (sourceColumnId === targetColumnId) {
      sourceColumn.cards.splice(targetIndex, 0, cardToMove);
      this.logger.info(`Card ${cardId} moved within same column to position ${targetIndex}`, 'KablanService', {
        boardId,
        columnId: sourceColumnId,
        cardId,
        newPosition: targetIndex
      });
    } else {
      // Find target column
      const targetColumn = board.columns.find(col => col.id === targetColumnId);
      if (!targetColumn) {
        this.logger.warning(`Column with ID "${targetColumnId}" not found`, 'KablanService', { 
          boardId, 
          targetColumnId 
        });
        throw new NotFoundException(`Column with ID "${targetColumnId}" not found`);
      }
      
      // Insert card at target position
      targetColumn.cards.splice(targetIndex, 0, cardToMove);
      
      this.logger.info(`Card ${cardId} moved from column ${sourceColumnId} to ${targetColumnId} at position ${targetIndex}`, 'KablanService', {
        boardId,
        cardId,
        sourceColumnId,
        targetColumnId,
        targetIndex
      });
    }
    
    // Update the board's timestamp
    board.updatedAt = new Date().toISOString();
    
    // Update the board in our storage
    this.boards[boardIndex] = board;
    
    return board;
  }
}
