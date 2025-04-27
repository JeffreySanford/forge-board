import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KablanBoard, KablanBoardDocument } from './schemas/kablan-board.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KablanService {
  private readonly logger = new Logger(KablanService.name);

  constructor(
    @InjectModel(KablanBoard.name) private kablanBoardModel: Model<KablanBoardDocument>,
  ) {}

  async getBoards(): Promise<KablanBoard[]> {
    return this.kablanBoardModel.find().exec();
  }

  async getBoardById(id: string): Promise<KablanBoard> {
    const board = await this.kablanBoardModel.findOne({ id }).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }
    return board;
  }

  async createBoard(data: { name: string }): Promise<KablanBoard> {
    const newBoard = new this.kablanBoardModel({
      id: uuidv4(),
      name: data.name,
      columns: []
    });
    return newBoard.save();
  }

  async addColumnToBoard(boardId: string, data: { title: string }): Promise<KablanBoard> {
    const board = await this.getBoardById(boardId);
    
    board.columns.push({
      id: uuidv4(),
      title: data.title,
      cards: []
    });
    
    return this.kablanBoardModel.findOneAndUpdate(
      { id: boardId },
      { $set: { columns: board.columns } },
      { new: true }
    ).exec();
  }

  async addCardToColumn(boardId: string, columnId: string, data: { title: string, description?: string }): Promise<KablanBoard> {
    const board = await this.getBoardById(boardId);
    
    const columnIndex = board.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column with ID "${columnId}" not found in board "${boardId}"`);
    }
    
    board.columns[columnIndex].cards.push({
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      priority: 'medium',
      createdAt: new Date(),
      assignee: null
    });
    
    return this.kablanBoardModel.findOneAndUpdate(
      { id: boardId },
      { $set: { columns: board.columns } },
      { new: true }
    ).exec();
  }

  async moveCard(boardId: string, data: { cardId: string, sourceColumnId: string, targetColumnId: string, sourceIndex: number, targetIndex: number }): Promise<KablanBoard> {
    const { cardId, sourceColumnId, targetColumnId, sourceIndex, targetIndex } = data;
    const board = await this.getBoardById(boardId);
    
    // Find source column
    const sourceColumnIndex = board.columns.findIndex(col => col.id === sourceColumnId);
    if (sourceColumnIndex === -1) {
      throw new NotFoundException(`Source column with ID "${sourceColumnId}" not found`);
    }
    
    // Find target column
    const targetColumnIndex = board.columns.findIndex(col => col.id === targetColumnId);
    if (targetColumnIndex === -1) {
      throw new NotFoundException(`Target column with ID "${targetColumnId}" not found`);
    }
    
    // Remove card from source column
    const [card] = board.columns[sourceColumnIndex].cards.splice(sourceIndex, 1);
    
    // Add card to target column
    board.columns[targetColumnIndex].cards.splice(targetIndex, 0, card);
    
    // Save updated board
    return this.kablanBoardModel.findOneAndUpdate(
      { id: boardId },
      { $set: { columns: board.columns } },
      { new: true }
    ).exec();
  }
}
