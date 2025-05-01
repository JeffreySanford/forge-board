import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  KablanBoardDto, 
  CardDto, 
  ColumnDto, 
  CreateBoardDto, 
  CreateColumnDto, 
  CreateCardDto, 
  MoveCardDto,
  PhaseDto
} from './dto/kablan.dto';

@Injectable()
export class KablanService {
  private readonly logger = new Logger(KablanService.name);
  
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

  // Get the current storage type
  getStorageType(): string {
    return this.storageType;
  }

  // Get all boards
  async getBoards(): Promise<KablanBoardDto[]> {
    return this.boards;
  }

  // Get a specific board by ID
  async getBoardById(id: string): Promise<KablanBoardDto> {
    const board = this.boards.find(b => b.id === id);
    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }
    return board;
  }

  // Create a new board
  async createBoard(createBoardDto: CreateBoardDto): Promise<KablanBoardDto> {
    const newBoard: KablanBoardDto = {
      id: uuidv4(),
      name: createBoardDto.name,
      columns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.boards.push(newBoard);
    return newBoard;
  }

  // Add a column to a board
  async addColumn(boardId: string, createColumnDto: CreateColumnDto): Promise<KablanBoardDto> {
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
    
    return board;
  }

  // Add a card to a column
  async addCard(boardId: string, columnId: string, createCardDto: CreateCardDto): Promise<KablanBoardDto> {
    const board = await this.getBoardById(boardId);
    
    const column = board.columns.find(col => col.id === columnId);
    if (!column) {
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
    
    return board;
  }

  // Move a card within a board
  async moveCard(boardId: string, moveCardDto: MoveCardDto): Promise<KablanBoardDto> {
    const { cardId, sourceColumnId, targetColumnId, sourceIndex, targetIndex } = moveCardDto;
    
    // Find the board
    const boardIndex = this.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) {
      throw new NotFoundException(`Board with ID "${boardId}" not found`);
    }
    
    // Create a deep copy to avoid mutating the original
    const board = JSON.parse(JSON.stringify(this.boards[boardIndex])) as KablanBoardDto;
    
    // Find source column
    const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
    if (!sourceColumn) {
      throw new NotFoundException(`Column with ID "${sourceColumnId}" not found`);
    }
    
    // Find card index in source column if not provided
    const actualSourceIndex = sourceIndex >= 0 ? sourceIndex : 
      sourceColumn.cards.findIndex(card => card.id === cardId);
    
    if (actualSourceIndex === -1) {
      throw new NotFoundException(`Card with ID "${cardId}" not found in source column`);
    }
    
    // Get the card to move
    const [cardToMove] = sourceColumn.cards.splice(actualSourceIndex, 1);
    
    // Update the card's timestamp
    cardToMove.updatedAt = new Date().toISOString();
    
    // If moving to same column
    if (sourceColumnId === targetColumnId) {
      sourceColumn.cards.splice(targetIndex, 0, cardToMove);
    } else {
      // Find target column
      const targetColumn = board.columns.find(col => col.id === targetColumnId);
      if (!targetColumn) {
        throw new NotFoundException(`Column with ID "${targetColumnId}" not found`);
      }
      
      // Insert card at target position
      targetColumn.cards.splice(targetIndex, 0, cardToMove);
    }
    
    // Update the board's timestamp
    board.updatedAt = new Date().toISOString();
    
    // Update the board in our storage
    this.boards[boardIndex] = board;
    
    return board;
  }
}
