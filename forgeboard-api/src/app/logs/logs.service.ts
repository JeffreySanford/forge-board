import { Injectable } from '@nestjs/common';
import { LogEntry, LogQueryResponse, LogFilter } from '@forge-board/shared/api-interfaces';

@Injectable()
export class LogsService {
  private logs: LogEntry[] = [];

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
    
    // Use direct console.debug for internal logging to prevent loops.
    // Include a shortened message to avoid overly verbose console output.
    const shortMessage = logEntry.message.length > 100 ? `${logEntry.message.substring(0, 97)}...` : logEntry.message;
    console.debug(`[${LogsService.name}] Log saved: ${logEntry.source} - "${shortMessage}"`);
    
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

  getLogs(query: Partial<LogFilter>): LogQueryResponse {
    let filteredLogs = [...this.logs];
    
    // Apply filters
    if (query.level) {
      if (typeof query.level === 'string') {
        // If it's a string representation, split and parse it
        const levelStrings = (query.level as string).split(',');
        const levels = levelStrings.map(l => parseInt(l, 10));
        filteredLogs = filteredLogs.filter(log => levels.includes(log.level));
      } else if (Array.isArray(query.level)) {
        // If it's an array of enum values
        filteredLogs = filteredLogs.filter(log => query.level && Array.isArray(query.level) && query.level.includes(log.level));
      } else {
        // If it's a single enum value
        filteredLogs = filteredLogs.filter(log => log.level === query.level);
      }
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
    
    // Apply pagination - fix parseInt on potentially numeric values
    const skip = typeof query.skip === 'string' ? parseInt(query.skip, 10) : (query.skip || 0);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 100);
    
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
