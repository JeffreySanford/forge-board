import { Controller, Get, Post, Body, Query, Param, Delete } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerGateway } from './logger.gateway';
import { LogEntry, LogFilter, LogResponse, LogLevelType } from '@forge-board/shared/api-interfaces';
import { v4 as uuid } from 'uuid';

interface CreateLogDto {
  level: LogLevelType;
  message: string;
  source?: string;
  data?: Record<string, unknown>;
  context?: string;
  tags?: string[];
}

@Controller('api/logs')
export class LoggerController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly loggerGateway: LoggerGateway
  ) {}
  
  @Get()
  getLogs(@Query() filter: LogFilter): LogResponse {
    const logs = this.loggerService.getLogs(filter);
    const totalCount = this.loggerService.getLogs().length;
    return {
      logs,
      totalCount,
      filtered: Object.keys(filter).length > 0
    };
  }
  
  @Get(':id')
  getLogById(@Param('id') id: string): LogEntry | null {
    const logs = this.loggerService.getLogs({
      search: id
    });
    
    // Return first matching log or null
    return logs.length > 0 ? logs[0] : null;
  }

  @Post()
  createLog(@Body() logEntry: Omit<LogEntry, 'timestamp' | 'id'>): LogEntry {
    // Create log using logger service
    const entry = this.loggerService.log(
      logEntry.level,
      logEntry.message,
      logEntry.context || logEntry.source,
      logEntry.data || {}
    );
    
    // Broadcast to websocket clients
    this.loggerGateway.broadcastLogEntry(entry);
    
    return entry;
  }
  
  @Post('batch')
  createBatchLogs(@Body() { logs }: { logs: Omit<LogEntry, 'timestamp' | 'id'>[] }): LogEntry[] {
    const entries: LogEntry[] = [];
    
    for (const logEntry of logs) {
      // Create log using logger service
      const entry = this.loggerService.log(
        logEntry.level,
        logEntry.message,
        logEntry.context || logEntry.source,
        logEntry.data || {}
      );
      
      // Broadcast to websocket clients
      this.loggerGateway.broadcastLogEntry(entry);
      
      entries.push(entry);
    }
    
    return entries;
  }
  
  @Delete(':id')
  deleteLog(@Param('id') id: string): { success: boolean } {
    // This would normally delete a log, but for simplicity we'll just return success
    return { success: true };
  }
  
  @Post('clear')
  clearLogs(): { success: boolean } {
    // This would normally clear logs, but for simplicity we'll just return success
    return { success: true };
  }
}
