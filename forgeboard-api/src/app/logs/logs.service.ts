import { Injectable, Logger } from '@nestjs/common';
import { LogEntry, LogQueryResponse } from '@forge-board/shared/api-interfaces';

@Injectable()
export class LogsService {
  private logs: LogEntry[] = [];
  private readonly logger = new Logger(LogsService.name);
  
  constructor() {}

  saveLog(logEntry: LogEntry): { status: boolean, message: string, log: LogEntry } {
    // Add timestamp if not provided
    if (!logEntry.timestamp) {
      logEntry.timestamp = new Date().toISOString();
    }
    
    // Generate ID if not provided
    if (!logEntry.id) {
      logEntry.id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Store the log
    this.logs.unshift(logEntry);
    this.logger.debug(`Log saved: ${logEntry.source} - ${logEntry.message}`);
    
    // Limit array size to prevent memory issues
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(0, 10000);
    }
    
    return { 
      status: true, 
      message: 'Log saved successfully', 
      log: logEntry 
    };
  }

  getLogs(query: any): LogQueryResponse {
    let filteredLogs = [...this.logs];
    
    // Apply filters
    if (query.level) {
      const levels = Array.isArray(query.level) 
        ? query.level 
        : query.level.split(',');
      filteredLogs = filteredLogs.filter(log => levels.includes(log.level));
    }
    
    if (query.service) {
      filteredLogs = filteredLogs.filter(log => log.source === query.service);
    }
    
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchLower)
      );
    }
    
    if (query.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(query.startDate)
      );
    }
    
    if (query.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(query.endDate)
      );
    }

    if (query.afterTimestamp) {
      filteredLogs = filteredLogs.filter(log =>
        new Date(log.timestamp) > new Date(query.afterTimestamp)
      );
    }
    
    // Get total count before pagination
    const total = filteredLogs.length;
    
    // Apply pagination
    const skip = parseInt(query.skip) || 0;
    const limit = parseInt(query.limit) || 100;
    
    filteredLogs = filteredLogs.slice(skip, skip + limit);
    
    return {
      status: true,
      logs: filteredLogs,
      totalCount: total, // Use totalCount as per the interface
      filtered: Object.keys(query).length > 0,
      timestamp: new Date().toISOString(),
      total, // Keep total for backwards compatibility
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    };
  }
}
