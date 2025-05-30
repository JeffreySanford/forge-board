import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { 
  KanbanBoardDto, 
  CardDto, 
  ColumnDto, 
  CreateBoardDto, 
  CreateColumnDto, 
  CreateCardDto, 
  MoveCardDto,
} from './dto/kanban.dto';
import { LoggerService } from '../logger/logger.service';
import { KanbanBoard } from '../models/kanban.model';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class KanbanService {
  // Storage type - can be changed to reflect different backends
  private storageType: 'memory' | 'localStorage' | 'mongodb' | 'blockchain' = 'memory';
  
  // In-memory storage that will be populated from mock files
  private boards: KanbanBoardDto[] = [];
  private mockDataForced = false;

  constructor(
    private readonly logger: LoggerService,
    @InjectModel(KanbanBoard.name) private kanbanBoardModel: Model<KanbanBoard>
  ) {
    this.loadMockData();
  }

  private loadMockData(): void {
    try {
      // Fix typo: Load comprehensive planning board data (kanban not kablan)
      const planningBoardPath = path.join(__dirname, '../../mocks/kanban/mock-boards.json');
      if (fs.existsSync(planningBoardPath)) {
        const planningData = JSON.parse(fs.readFileSync(planningBoardPath, 'utf8'));
        this.boards.push(...planningData);
        this.logger.info(`Loaded ${planningData.length} planning boards from kanban mock data`, 'KanbanService');
      } else {
        this.logger.info(`Planning board file not found at: ${planningBoardPath}`, 'KanbanService');
      }

      // Load ForgeBoard project stories
      const forgeboardStoriesPath = path.join(__dirname, '../../mocks/kanban-forge-board-stories.json');
      if (fs.existsSync(forgeboardStoriesPath)) {
        const storiesData = JSON.parse(fs.readFileSync(forgeboardStoriesPath, 'utf8'));
        this.boards.push(...storiesData);
        this.logger.info(`Loaded ${storiesData.length} ForgeBoard story boards`, 'KanbanService');
      } else {
        this.logger.info(`ForgeBoard stories file not found at: ${forgeboardStoriesPath}`, 'KanbanService');
      }

      // Load example boards
      const exampleBoardsPath = path.join(__dirname, '../../mocks/kanban-example-boards.json');
      if (fs.existsSync(exampleBoardsPath)) {
        const exampleData = JSON.parse(fs.readFileSync(exampleBoardsPath, 'utf8'));
        this.boards.push(...exampleData);
        this.logger.info(`Loaded ${exampleData.length} example boards`, 'KanbanService');
      } else {
        this.logger.info(`Example boards file not found at: ${exampleBoardsPath}`, 'KanbanService');
      }

      this.logger.info(`Total boards loaded: ${this.boards.length}`, 'KanbanService', {
        totalBoards: this.boards.length,
        boardNames: this.boards.map(b => b.name)
      });

    } catch (error) {
      this.logger.error('Error loading mock data, using fallback', 'KanbanService', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error
      });
      
      // Fallback to basic data if file loading fails
      this.boards = [{
        id: "1",
        name: "Fallback Planning Board",
        currentPhase: "planning",
        phases: {
          planning: { active: true, startDate: new Date().toISOString() },
          development: { active: false },
          completion: { active: false }
        },
        columns: [{
          id: "col1",
          name: "Backlog",
          order: 0,
          phase: "planning",
          cards: [{
            id: "card1",
            title: "Fallback Task",
            description: "This is fallback data - check mock file loading",
            priority: "medium",
            tags: ["fallback"],
            category: "project-management",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
    }
  }

  // Get the current storage type
  getStorageType(): string {
    this.logger.debug(`Getting storage type: ${this.storageType}`, 'KanbanService', { storageType: this.storageType });
    return this.storageType;
  }

  // Set storage type
  setStorageType(type: 'memory' | 'localStorage' | 'mongodb' | 'blockchain'): void {
    this.storageType = type;
    this.logger.info(`Storage type changed to: ${type}`, 'KanbanService', { storageType: type });
  }

  // Toggle mock data (for frontend compatibility)
  toggleMockData(force: boolean): void {
    this.mockDataForced = force;
    this.logger.info(`Mock data forced: ${force}`, 'KanbanService', { mockDataForced: force });
  }

  // Check if using mock data
  isUsingMockData(): boolean {
    return this.mockDataForced || this.storageType === 'memory';
  }

  // Check storage connection
  checkStorageConnection(): boolean {
    // This could be expanded to check MongoDB connection if that backend is used
    this.logger.debug(`Checking storage connection for type: ${this.storageType}`, 'KanbanService', { storageType: this.storageType });
    return true;
  }
  // Get all boards
  async getBoards(): Promise<KanbanBoardDto[]> {
    this.logger.info(`Getting boards from ${this.storageType} storage`, 'KanbanService', { 
      storageType: this.storageType,
      inMemoryBoardCount: this.boards.length 
    });

    // If we're using mongodb or memory (in-memory mongo), try to get from database first
    if (this.storageType === 'mongodb' || this.storageType === 'memory') {
      try {
        const mongoBoards = await this.kanbanBoardModel.find().exec();
        this.logger.info(`Found ${mongoBoards.length} boards in MongoDB`, 'KanbanService', {
          mongoBoards: mongoBoards.length,
          storageType: this.storageType
        });
        
        if (mongoBoards.length > 0) {
          // Convert MongoDB documents to DTOs
          const boardDtos = mongoBoards.map(board => this.convertMongoToDto(board));
          
          // Log detailed board info
          const totalCards = boardDtos.reduce((total, board) => 
            total + (board.columns?.reduce((colTotal, col) => colTotal + (col.cards?.length || 0), 0) || 0), 0);
          
          this.logger.info(`Returning ${boardDtos.length} boards with ${totalCards} total cards from MongoDB`, 'KanbanService', {
            boardCount: boardDtos.length,
            totalCards,
            boardNames: boardDtos.map(b => b.name)
          });
          
          return boardDtos;
        }
      } catch (error) {
        this.logger.error('Failed to load boards from MongoDB, falling back to mock data', 'KanbanService', { 
          error: error.message,
          storageType: this.storageType
        });
      }
    }
    
    // Fallback to in-memory boards
    this.logger.info(`Returning ${this.boards.length} in-memory boards`, 'KanbanService', {
      inMemoryBoards: this.boards.length,
      storageType: this.storageType
    });
    return this.boards;
  }
  // Get a specific board by ID
  async getBoardById(id: string): Promise<KanbanBoardDto> {
    this.logger.debug(`Looking for board with ID: ${id}`, 'KanbanService', { boardId: id });
    
    // If we're using mongodb or memory (in-memory mongo), try to get from database first
    if (this.storageType === 'mongodb' || this.storageType === 'memory') {
      try {
        const mongoBoard = await this.kanbanBoardModel.findOne({ 
          $or: [{ id }, { _id: id }] 
        }).exec();
        
        if (mongoBoard) {
          this.logger.debug(`Found board in MongoDB: ${mongoBoard.name}`, 'KanbanService', { 
            boardId: id, 
            boardName: mongoBoard.name 
          });
          return this.convertMongoToDto(mongoBoard);
        }
      } catch (error) {
        this.logger.error(`Error querying MongoDB for board ${id}`, 'KanbanService', { 
          error: error.message,
          boardId: id
        });
      }
    }
    
    // Fallback to in-memory boards
    const board = this.boards.find(b => b.id === id);
    if (!board) {
      this.logger.warning(`Board with ID "${id}" not found`, 'KanbanService', { boardId: id });
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }
    
    this.logger.debug(`Found board in memory: ${board.name}`, 'KanbanService', { 
      boardId: id, 
      boardName: board.name 
    });
    return board;
  }

  // Create a new board
  async createBoard(createBoardDto: CreateBoardDto): Promise<KanbanBoardDto> {
    this.logger.info(`Creating new board: ${createBoardDto.name}`, 'KanbanService', { 
      boardName: createBoardDto.name 
    });
    
    const newBoard: KanbanBoardDto = {
      id: uuidv4(),
      name: createBoardDto.name,
      columns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.boards.push(newBoard);
    
    this.logger.info(`Board created with ID: ${newBoard.id}`, 'KanbanService', { 
      boardId: newBoard.id, 
      boardName: newBoard.name 
    });
    return newBoard;
  }

  // Add a column to a board
  async addColumn(boardId: string, createColumnDto: CreateColumnDto): Promise<KanbanBoardDto> {
    this.logger.info(`Adding column to board ${boardId}`, 'KanbanService', { 
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
    
    this.logger.info(`Column ${newColumn.name} added with ID ${newColumn.id}`, 'KanbanService', {
      boardId,
      columnId: newColumn.id,
      columnName: newColumn.name
    });
    
    return board;
  }

  // Add a card to a column
  async addCard(boardId: string, columnId: string, createCardDto: CreateCardDto): Promise<KanbanBoardDto> {
    this.logger.info(`Adding card to column ${columnId} in board ${boardId}`, 'KanbanService', {
      boardId,
      columnId,
      cardTitle: createCardDto.title
    });
    
    const board = await this.getBoardById(boardId);
    
    const column = board.columns.find(col => col.id === columnId);
    if (!column) {
      this.logger.warning(`Column with ID "${columnId}" not found`, 'KanbanService', { 
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
    
    this.logger.info(`Card "${newCard.title}" added with ID ${newCard.id}`, 'KanbanService', {
      boardId,
      columnId,
      cardId: newCard.id,
      cardTitle: newCard.title
    });
    
    return board;
  }

  // Move a card within a board
  async moveCard(boardId: string, moveCardDto: MoveCardDto): Promise<KanbanBoardDto> {
    const { cardId, sourceColumnId, targetColumnId, sourceIndex, targetIndex } = moveCardDto;
    
    this.logger.info(`Moving card ${cardId} from column ${sourceColumnId} to ${targetColumnId}`, 'KanbanService', {
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
      this.logger.warning(`Board with ID "${boardId}" not found`, 'KanbanService', { boardId });
      throw new NotFoundException(`Board with ID "${boardId}" not found`);
    }
    
    // Create a deep copy to avoid mutating the original
    const board = JSON.parse(JSON.stringify(this.boards[boardIndex])) as KanbanBoardDto;
    
    // Find source column
    const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
    if (!sourceColumn) {
      this.logger.warning(`Column with ID "${sourceColumnId}" not found`, 'KanbanService', { 
        boardId, 
        sourceColumnId 
      });
      throw new NotFoundException(`Column with ID "${sourceColumnId}" not found`);
    }
    
    // Find card index in source column if not provided
    const actualSourceIndex = sourceIndex >= 0 ? sourceIndex : 
      sourceColumn.cards.findIndex(card => card.id === cardId);
    
    if (actualSourceIndex === -1) {
      this.logger.warning(`Card with ID "${cardId}" not found in source column`, 'KanbanService', {
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
      this.logger.info(`Card ${cardId} moved within same column to position ${targetIndex}`, 'KanbanService', {
        boardId,
        columnId: sourceColumnId,
        cardId,
        newPosition: targetIndex
      });
    } else {
      // Find target column
      const targetColumn = board.columns.find(col => col.id === targetColumnId);
      if (!targetColumn) {
        this.logger.warning(`Column with ID "${targetColumnId}" not found`, 'KanbanService', { 
          boardId, 
          targetColumnId 
        });
        throw new NotFoundException(`Column with ID "${targetColumnId}" not found`);
      }
      
      // Insert card at target position
      targetColumn.cards.splice(targetIndex, 0, cardToMove);
      
      this.logger.info(`Card ${cardId} moved from column ${sourceColumnId} to ${targetColumnId} at position ${targetIndex}`, 'KanbanService', {
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

  // Add missing method for socket gateway
  async getBoardsForSocket(): Promise<{ boards: KanbanBoardDto[]; storageType: string }> {
    const boards = await this.getBoards();
    return {
      boards,
      storageType: this.getStorageType()
    };
  }

  // Create a new card (alias for addCard for socket compatibility)
  async createCard(boardId: string, columnId: string, createCardDto: CreateCardDto): Promise<KanbanBoardDto> {
    return this.addCard(boardId, columnId, createCardDto);
  }

  // Update an existing card
  async updateCard(boardId: string, cardId: string, updates: Partial<CreateCardDto>): Promise<KanbanBoardDto> {
    this.logger.info(`Updating card ${cardId} in board ${boardId}`, 'KanbanService', {
      boardId,
      cardId,
      updates
    });

    const board = await this.getBoardById(boardId);
    
    // Find the card in any column
    let targetCard: CardDto | undefined;
    let targetColumn: ColumnDto | undefined;
    
    for (const column of board.columns) {
      targetCard = column.cards.find(card => card.id === cardId);
      if (targetCard) {
        targetColumn = column;
        break;
      }
    }
    
    if (!targetCard || !targetColumn) {
      this.logger.warning(`Card with ID "${cardId}" not found`, 'KanbanService', { boardId, cardId });
      throw new NotFoundException(`Card with ID "${cardId}" not found`);
    }
    
    // Update card properties
    Object.assign(targetCard, updates, { updatedAt: new Date().toISOString() });
    board.updatedAt = new Date().toISOString();
    
    this.logger.info(`Card ${cardId} updated successfully`, 'KanbanService', {
      boardId,
      cardId,
      updatedFields: Object.keys(updates)
    });
    
    return board;
  }

  // Delete a card
  async deleteCard(boardId: string, cardId: string): Promise<KanbanBoardDto> {
    this.logger.info(`Deleting card ${cardId} from board ${boardId}`, 'KanbanService', {
      boardId,
      cardId
    });

    const board = await this.getBoardById(boardId);
    
    // Find and remove the card from any column
    let cardFound = false;
    
    for (const column of board.columns) {
      const cardIndex = column.cards.findIndex(card => card.id === cardId);
      if (cardIndex !== -1) {
        column.cards.splice(cardIndex, 1);
        cardFound = true;
        break;
      }
    }
    
    if (!cardFound) {
      this.logger.warning(`Card with ID "${cardId}" not found`, 'KanbanService', { boardId, cardId });
      throw new NotFoundException(`Card with ID "${cardId}" not found`);
    }
    
    board.updatedAt = new Date().toISOString();
    
    this.logger.info(`Card ${cardId} deleted successfully`, 'KanbanService', {
      boardId,
      cardId
    });
    
    return board;
  }
  // Create a new column (alias for addColumn for socket compatibility)
  async createColumn(boardId: string, createColumnDto: CreateColumnDto): Promise<KanbanBoardDto> {
    return this.addColumn(boardId, createColumnDto);
  }

  // Helper method to convert MongoDB document to DTO
  private convertMongoToDto(mongoBoard: any): KanbanBoardDto {
    return {
      id: mongoBoard.id || mongoBoard._id?.toString(),
      name: mongoBoard.name,
      columns: mongoBoard.columns || [],
      currentPhase: mongoBoard.currentPhase,
      phases: mongoBoard.phases || {},
      createdAt: mongoBoard.createdAt,
      updatedAt: mongoBoard.updatedAt
    };
  }
}
