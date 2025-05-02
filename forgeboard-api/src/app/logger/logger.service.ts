import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { 
  LogEntry, 
  LogFilter, 
  LogLevelEnum, 
  LogLevelString, 
  stringToLogLevelEnum,
  logLevelEnumToString, 
  LogQueryResponse,
  LogBatchResponse
} from '@forge-board/shared/api-interfaces';
import { v4 as uuid } from 'uuid';

// Extended interfaces for internal use
interface ExtendedLogEntry extends LogEntry {
  context?: string;
  stackTrace?: string;
  tags?: string[];
}

// Custom filter interface to handle additional properties
interface ExtendedFilter extends Partial<LogFilter> {
  contexts?: string[];
  sources?: string[];
  tags?: string[];
  startTime?: string;
  endTime?: string;
  offset?: number;
  skip?: number;
  loglevels?: LogLevelEnum[]; // This property is needed for our internal implementation
}

@Injectable()
export class LoggerService {
  private readonly nestLogger = new NestLogger(LoggerService.name);
  private logs: ExtendedLogEntry[] = [];
  private readonly maxLogs = 1000; // Maximum number of logs to keep in memory

  constructor() {
    // Initialize with some sample logs
    this.createSampleLogs();
  }

  /**
   * Create a log entry with the specified level
   */
  log(level: LogLevelString, message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    // Create log entry
    const entry: ExtendedLogEntry = {
      id: uuid(),
      level,
      message,
      source: context, // Use context as source for backward compatibility
      timestamp: new Date().toISOString(),
      data: Object.keys(meta).length > 0 ? meta : undefined
    };
    
    // Add additional properties to extended entry
    entry.context = context;
    entry.tags = meta.tags as string[] | undefined;
    
    // Add stack trace for errors
    if (level === 'error' || level === 'fatal') {
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
      case 'warn':
        this.nestLogger.warn(message, context);
        break;
      case 'error':
      case 'fatal': {
        // Fix: Safely access stack property on meta.error by checking type
        const errorStack = meta?.error && 
          typeof meta.error === 'object' && 
          meta.error !== null && 
          'stack' in meta.error ? 
          String(meta.error.stack) : '';
        this.nestLogger.error(message, errorStack, context);
        break;
      }
      case 'trace':
        this.nestLogger.verbose(message, context);
        break;
    }
    
    return entry;
  }
  
  // Convenience methods
  debug(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('debug', message, context, meta);
  }
  
  info(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('info', message, context, meta);
  }
  
  warning(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('warning', message, context, meta);
  }
  
  error(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('error', message, context, meta);
  }

  fatal(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('fatal', message, context, meta);
  }

  trace(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log('trace', message, context, meta);
  }
  
  /**
   * Get logs with optional filtering
   * 
   * @param filter Filter criteria for log entries
   * @returns Filtered log entries
   */
  getLogs(filter: ExtendedFilter = { level: logLevelEnumToString(LogLevelEnum.INFO) }): ExtendedLogEntry[] {
    // Start with all logs
    let filteredLogs = [...this.logs];
    
    // Apply level filter based on the type of level provided
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        // If it's an array, include logs with any of the specified levels
        filteredLogs = filteredLogs.filter(log => 
          filter.level && Array.isArray(filter.level) && filter.level.includes(log.level)
        );
      } else {
        // If it's a single value, match exactly
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
    }
    
    // Legacy support for loglevels property - handle both cases
    if (filter.loglevels && Array.isArray(filter.loglevels) && filter.loglevels.length) {
      filteredLogs = filteredLogs.filter(log =>
        filter.loglevels && filter.loglevels.includes(stringToLogLevelEnum(log.level))
      );
    }
    
    // Apply source filter - use service from LogFilter first, fall back to sources
    if (filter.service) {
      filteredLogs = filteredLogs.filter(log => log.source === filter.service);
    } else if (filter.sources && filter.sources.length) {
      filteredLogs = filteredLogs.filter(log =>
        filter.sources && log.source && filter.sources.includes(log.source)
      );
    }
    
    // Apply context filter if available in extended filter
    if (filter.contexts && filter.contexts.length) {
      filteredLogs = filteredLogs.filter(log =>
        log.context && filter.contexts && filter.contexts.includes(log.context)
      );
    }
    
    // Apply tags filter if available in extended filter
    if (filter.tags && filter.tags.length) {
      filteredLogs = filteredLogs.filter(log =>
        log.tags && filter.tags && filter.tags.some(tag => log.tags && log.tags.includes(tag))
      );
    }
    
    // Apply date range filter - first try standard LogFilter properties
    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        filter.startDate && new Date(log.timestamp) >= new Date(filter.startDate)
      );
    }
    
    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        filter.endDate && new Date(log.timestamp) <= new Date(filter.endDate)
      );
    }
    
    // Support alternative date field names as fallback
    if (filter.startTime && !filter.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        filter.startTime && new Date(log.timestamp) >= new Date(filter.startTime)
      );
    }
    
    if (filter.endTime && !filter.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        filter.endTime && new Date(log.timestamp) <= new Date(filter.endTime)
      );
    }
    
    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchLower) || 
        (log.source && log.source.toLowerCase().includes(searchLower)) ||
        (log.context && log.context.toLowerCase().includes(searchLower)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination - try official property or fallbacks
    const skip = filter.skip || filter.offset || 0;
    const limit = filter.limit || filteredLogs.length;
    
    return filteredLogs.slice(skip, skip + limit);
  }
  
  /**
   * Create a query response with logs and metadata
   * 
   * @param logs Filtered log entries
   * @param totalCount Total number of logs
   * @param filtered Whether filtering was applied
   * @returns Structured log query response
   */
  createQueryResponse(logs: ExtendedLogEntry[], totalCount: number, filtered = false): LogQueryResponse {
    return {
      logs: logs as LogEntry[],
      totalCount,
      filtered,
      status: true,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create a batch response for log operations
   * 
   * @param success Whether the operation was successful
   * @param count Number of logs processed
   * @returns Structured batch response
   */
  createBatchResponse(success: boolean, count?: number): LogBatchResponse {
    return {
      success,
      count,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convert a LogLevelString to LogLevelEnum enum
   */
  private convertToLogLevel(level: LogLevelString): LogLevelEnum {
    return stringToLogLevelEnum(level);
  }

  /**
   * Create sample log entries for demonstration
   */
  private createSampleLogs(): void {
    this.info('Application started', 'AppModule', { version: '1.0.0', service: 'forgeboard-api' });
    this.warning('Running in development mode', 'ConfigService');
    this.debug('Initializing services', 'Bootstrap');
    this.error('Failed to connect to external service', 'ExternalService', { 
      error: new Error('Connection timeout'), 
      url: 'https://api.example.com' 
    });
    this.trace('Detailed initialization sequence', 'SystemLoader', { 
      steps: ['ConfigLoader', 'DatabaseConnection', 'MigrationCheck', 'RouteRegistration'] 
    });
    this.fatal('Critical system failure detected', 'HealthMonitor', {
      subsystem: 'Storage',
      errorCode: 'OUT_OF_SPACE'
    });
    
    // Create a sample log with tags
    const taggedLog = this.info('Sample tagged log entry', 'LoggerService', { tags: ['sample', 'documentation'] });
    
    // Ensure tags are properly set in the log entry
    const logIndex = this.logs.findIndex(log => log.id === taggedLog.id);
    if (logIndex !== -1) {
      this.logs[logIndex].tags = ['sample', 'documentation'];
    }
  }
}
