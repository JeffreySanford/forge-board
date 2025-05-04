import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from '../models/log.model';
import { LogDto, LogEntry } from '@forge-board/shared/api-interfaces';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private logs: LogEntry[] = [];

  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  async addLogs(logs: LogEntry[]): Promise<{ success: boolean }> {
    if (!logs || logs.length === 0) {
      return { success: false };
    }

    try {
      // Store logs in memory (in a real app, this would persist to a database)
      this.logs.push(...logs);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error adding logs: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  async createMany(logDtos: LogDto[]): Promise<Log[]> {
    const logs = logDtos.map(dto => new this.logModel(dto));
    return this.logModel.insertMany(logs);
  }

  getLogs(): LogEntry[] {
    // Basic implementation - would implement filtering in a real app
    return this.logs;
  }
}
