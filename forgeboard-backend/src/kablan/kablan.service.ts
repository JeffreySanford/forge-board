import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { KablanBoard, KablanBoardDocument } from './schemas/kablan-board.schema';
import {
  CreateBoardDto,
  CreateCardDto,
  CreateColumnDto,
  KablanBoardDto,
  MoveCardDto
} from './dto/kablan.dto';

@Injectable()
export class KablanService {
  private readonly logger = new Logger(KablanService.name);

  constructor(
    @InjectModel(KablanBoard.name) private kablanBoardModel: Model<KablanBoardDocument>,
  ) {
    // Create a default board if none exists
    this.initializeDefaultBoard();
  }

  private async initializeDefaultBoard(): Promise<void> {
    const boardCount = await this.kablanBoardModel.countDocuments().exec();
    if (boardCount === 0) {
      this.logger.log('Creating default Kablan board');
      const defaultBoard = new this.kablanBoardModel({
        id: uuidv4(),
        name: 'Default Kablan Board',
        columns: [
          {
            id: uuidv4(),
            name: 'To Do',
            order: 0,
            cards: []
          },
          {
            id: uuidv4(),
            name: 'In Progress',
            order: 1,
            cards: []
          },
          {
            id: uuidv4(),
            name: 'Done',
            order: 2,
            cards: []
          }
        ]
      });
      await defaultBoard.save();
      this.logger.log('Default board created successfully');
    }
  }

  async getBoards(): Promise<KablanBoardDto[]> {
    this.logger.log('Fetching all boards');
    const boards = await this.kablanBoardModel.find().exec();
    return boards;
  }

  async getBoardById(id: string): Promise<KablanBoardDto> {
    this.logger.log(`Fetching board with id: ${id}`);
    const board = await this.kablanBoardModel.findOne({ id }).exec();
    if (!board) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }
    return board;
  }

  async createBoard(createBoardDto: CreateBoardDto): Promise<KablanBoardDto> {
    this.logger.log('Creating new board', createBoardDto);
    const newBoard = new this.kablanBoardModel({
      id: uuidv4(),
      name: createBoardDto.name,
      columns: [],
    });
    await newBoard.save();
    return newBoard;
  }

  async addColumnToBoard(boardId: string, createColumnDto: CreateColumnDto): Promise<KablanBoardDto> {
    this.logger.log(`Adding column to board ${boardId}`, createColumnDto);
    const board = await this.getBoardById(boardId);
    
    const newColumn = {
      id: uuidv4(),
      name: createColumnDto.name,
      order: createColumnDto.order || board.columns.length,
      cards: []
    };
    
    board.columns.push(newColumn);
    
    await this.kablanBoardModel.updateOne(
      { id: boardId },
      { columns: board.columns }
    ).exec();
    
    return this.getBoardById(boardId);
  }

  async addCardToColumn(
    boardId: string, 
    columnId: string, 
    createCardDto: CreateCardDto
  ): Promise<KablanBoardDto> {
    this.logger.log(`Adding card to column ${columnId} in board ${boardId}`, createCardDto);
    const board = await this.getBoardById(boardId);
    
    const columnIndex = board.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column with id ${columnId} not found in board ${boardId}`);
    }
    
    const newCard = {
      id: uuidv4(),
      title: createCardDto.title,
      description: createCardDto.description,
      priority: createCardDto.priority,
      dueDate: createCardDto.dueDate,
      assignee: createCardDto.assignee,
      tags: createCardDto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    board.columns[columnIndex].cards.push(newCard);
    
    await this.kablanBoardModel.updateOne(
      { id: boardId },
      { columns: board.columns }
    ).exec();
    
    return this.getBoardById(boardId);
  }

  async moveCard(boardId: string, moveCardDto: MoveCardDto): Promise<KablanBoardDto> {
    this.logger.log(`Moving card in board ${boardId}`, moveCardDto);
    const board = await this.getBoardById(boardId);
    
    // Find source and target columns
    const sourceColumnIndex = board.columns.findIndex(col => col.id === moveCardDto.sourceColumnId);
    const targetColumnIndex = board.columns.findIndex(col => col.id === moveCardDto.targetColumnId);
    
    if (sourceColumnIndex === -1) {
      throw new NotFoundException(`Source column ${moveCardDto.sourceColumnId} not found`);
    }
    
    if (targetColumnIndex === -1) {
      throw new NotFoundException(`Target column ${moveCardDto.targetColumnId} not found`);
    }
    
    // Find the card to move
    const cardIndex = board.columns[sourceColumnIndex].cards.findIndex(
      card => card.id === moveCardDto.cardId
    );
    
    if (cardIndex === -1) {
      throw new NotFoundException(`Card ${moveCardDto.cardId} not found in column ${moveCardDto.sourceColumnId}`);
    }
    
    // Extract the card
    const [card] = board.columns[sourceColumnIndex].cards.splice(cardIndex, 1);
    
    // Update timestamp
    card.updatedAt = new Date().toISOString();
    
    // Insert the card at the new position
    board.columns[targetColumnIndex].cards.splice(
      moveCardDto.newIndex, 
      0, 
      card
    );
    
    await this.kablanBoardModel.updateOne(
      { id: boardId },
      { columns: board.columns }
    ).exec();
    
    return this.getBoardById(boardId);
  }
}
