import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { LogEntry, LogFilter, LogLevelType } from '@forge-board/shared/api-interfaces';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggerService {
  private readonly nestLogger = new NestLogger(LoggerService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000; // Maximum number of logs to keep in memory

  constructor() {
    // Create sample log entries
    this.createSampleLogs();
  }

  /**
   * Create a log entry with the specified level
   */
  log(level: LogLevelType, message: string, context: string = 'app', meta: Record<string, any> = {}): LogEntry {
    // Create log entry
    const entry: LogEntry = {
      id: uuid(),
      level,
      message,
      source: context, // Use context as source for backward compatibility
      timestamp: new Date().toISOString(),
      data: Object.keys(meta).length > 0 ? meta : undefined,
      context, // Include context as a separate field
      tags: meta.tags // Include tags from metadata if provided
    };
    
    // Add stack trace for errors
    if (level === 'error') {  // Removed 'critical' comparison since it's not in LogLevelType
      entry.stackTrace = new Error().stack;
    }
    
    // Add to in-memory logs
    this.logs.unshift(entry);
    
    // Trim logs if they exceed maximum size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Also log to console using NestJS logger
    switch (level) {
      case 'debug':
        this.nestLogger.debug(message, context);
        break;
      case 'info':
        this.nestLogger.log(message, context);
        break;
      case 'warning':
        this.nestLogger.warn(message, context);
        break;
      case 'error':
        this.nestLogger.error(message, meta?.error?.stack || '', context);
        break;
    }
    
    return entry;
  }
  
  // Convenience methods
  debug(message: string, context: string = 'app', meta: Record<string, any> = {}): LogEntry {
    return this.log('debug', message, context, meta);
  }
  
  info(message: string, context: string = 'app', meta: Record<string, any> = {}): LogEntry {
    return this.log('info', message, context, meta);
  }
  
  warning(message: string, context: string = 'app', meta: Record<string, any> = {}): LogEntry {
    return this.log('warning', message, context, meta);
  }
  
  error(message: string, context: string = 'app', meta: Record<string, any> = {}): LogEntry {
    return this.log('error', message, context, meta);
  }
  
  /**
   * Get logs with optional filtering
   */
  getLogs(filter: LogFilter = {}): LogEntry[] {
    // Start with all logs
    let filteredLogs = [...this.logs];
    
    // Apply level filter
    if (filter.levels && filter.levels.length) {
      filteredLogs = filteredLogs.filter(log =>
        filter.levels.includes(log.level)
      );
    }
    
    // Apply source filter
    if (filter.sources && filter.sources.length) {
      filteredLogs = filteredLogs.filter(log =>
        filter.sources.includes(log.source)
      );
    }
    
    // Apply context filter
    if (filter.contexts && filter.contexts.length) {
      filteredLogs = filteredLogs.filter(log =>
        log.context && filter.contexts.includes(log.context)
      );
    }
    
    // Apply tags filter
    if (filter.tags && filter.tags.length) {
      filteredLogs = filteredLogs.filter(log =>
        log.tags && filter.tags.some(tag => log.tags.includes(tag))
      );
    }
    
    // Apply date range filter
    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filter.startDate)
      );
    }
    
    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filter.endDate)
      );
    }
    
    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchLower) || 
        log.source.toLowerCase().includes(searchLower) ||
        (log.context && log.context.toLowerCase().includes(searchLower)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || filteredLogs.length;
    
    return filteredLogs.slice(offset, offset + limit);
  }
  
  /**
   * Create sample log entries for demonstration
   */
  private createSampleLogs(): void {
    this.info('Application started', 'AppModule', { version: '1.0.0', service: 'forgeboard-api' });
    this.warning('Running in development mode', 'ConfigService');
    
    // Create a sample log with tags
    const taggedLog = this.info('Sample tagged log entry', 'LoggerService', { tags: ['sample', 'documentation'] });
    
    // Ensure tags are properly set in the log entry
    const logIndex = this.logs.findIndex(log => log.id === taggedLog.id);
    if (logIndex !== -1 && !this.logs[logIndex].tags) {
      this.logs[logIndex].tags = ['sample', 'documentation'];
    }
  }
}
