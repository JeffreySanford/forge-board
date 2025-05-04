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
import { Subject } from 'rxjs';
import { shouldEnableConsoleLogging } from '../../bootstrap';

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
  afterTimestamp?: string; // Explicitly add it here for TypeScript clarity
}

@Injectable()
export class LoggerService {
  private readonly nestLogger = new NestLogger(LoggerService.name);
  private logs: ExtendedLogEntry[] = [];
  private readonly maxLogs = 1000; // Maximum number of logs to keep in memory
  private readonly enableConsoleOutput: boolean;
  
  // Subject to notify subscribers when a new log is created
  public readonly newLogEntry$ = new Subject<ExtendedLogEntry>();

  constructor() {
    // Read from environment config
    this.enableConsoleOutput = shouldEnableConsoleLogging();
    
    // Initialize with some sample logs
    this.createSampleLogs();
  }

  /**
   * Create a log entry with the specified level
   */
  log(level: LogLevelEnum, message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    // LOOP PREVENTION: Check if this is a log about logs
    const isLoggingLog = 
      (context.toLowerCase().includes('log') || 
       message.toLowerCase().includes('log entry') ||
       message.toLowerCase().includes('received log')) &&
      !meta['allowLogging']; // Special flag to allow critical logging logs
    
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
    if (level === LogLevelEnum.ERROR || level === LogLevelEnum.FATAL) {
      entry.stackTrace = new Error().stack;
    }
    
    // If this is a logging log, mark it specially for the UI
    if (isLoggingLog) {
      entry.isLoggingLoop = true;
    }
    
    // Add to in-memory logs
    this.logs.unshift(entry);
    
    // Trim logs if they exceed maximum size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Log to NestJS logger as well, but only if console output is enabled
    if (this.enableConsoleOutput) {
      const levelString = logLevelEnumToString(level);
      switch (levelString) {
        case 'debug': {
          this.nestLogger.debug(message, context);
          break;
        }
        case 'info': {
          this.nestLogger.log(message, context);
          break;
        }
        case 'warning': 
        case 'warn': {
          this.nestLogger.warn(message, context);
          break;
        }
        case 'error': 
        case 'fatal': {
          const errorStack = meta.error && 
            typeof meta.error === 'object' && 
            meta.error !== null && 
            'stack' in meta.error ? 
            String(meta.error.stack) : '';
          this.nestLogger.error(message, errorStack, context);
          break;
        }
        case 'trace': {
          this.nestLogger.verbose(message, context);
          break;
        }
      }
    }
    
    // Notify subscribers, but only if this isn't a logging log (prevent loops)
    if (!isLoggingLog) {
      this.newLogEntry$.next(entry);
    }
    
    return entry;
  }
  
  // Convenience methods
  debug(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.DEBUG, message, context, meta);
  }
  
  info(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.INFO, message, context, meta);
  }
  
  warning(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.WARN, message, context, meta);
  }
  
  error(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.ERROR, message, context, meta);
  }

  fatal(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.FATAL, message, context, meta);
  }

  trace(message: string, context = 'app', meta: Record<string, unknown> = {}): ExtendedLogEntry {
    return this.log(LogLevelEnum.TRACE, message, context, meta);
  }
  
  /**
   * Get logs with optional filtering and optimized for incremental updates
   * 
   * @param filter Filter criteria for log entries
   * @returns Filtered log entries
   */
  getLogs(filter: ExtendedFilter = { level: LogLevelEnum.INFO }): ExtendedLogEntry[] {
    // Start with all logs
    let filteredLogs = [...this.logs];
    
    // If afterTimestamp is specified, only return logs newer than that timestamp
    // This is a key optimization for incremental updates
    if (filter.afterTimestamp) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) > new Date(filter.afterTimestamp as string)
      );
    }
    
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
        filter.loglevels && filter.loglevels.includes(log.level)
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
    
    // Use clear mock prefix for sample errors to avoid confusion
    this.error('[SAMPLE] Example error - not a real issue', 'ExampleService', { 
      error: new Error('This is a sample error for demonstration purposes only'), 
      url: 'https://api.example.com',
      sampleLog: true
    });
    
    this.trace('Detailed initialization sequence', 'SystemLoader', { 
      steps: ['ConfigLoader', 'DatabaseConnection', 'MigrationCheck', 'RouteRegistration'] 
    });
    
    // Use clear mock prefix for sample errors to avoid confusion
    this.fatal('[SAMPLE] Example critical error - not a real issue', 'ExampleMonitor', {
      subsystem: 'Storage',
      errorCode: 'OUT_OF_SPACE',
      sampleLog: true
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
