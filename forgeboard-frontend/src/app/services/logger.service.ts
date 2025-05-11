import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LogDispatchService } from './log-dispatch.service';
import { SocketRegistryService } from './socket-registry.service';
import { 
  LogEntry, 
  LogFilter, 
  LogLevelEnum, 
  LogLevelString,
  logLevelEnumToString,
  stringToLogLevelEnum
} from '@forge-board/shared/api-interfaces';

// Logger types to maintain backward compatibility
export type LogLevelType = LogLevelString;

// Internal enum for log levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

/**
 * Common log metadata structure
 */
export interface LogMetadata {
  service?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  includeTimestamp: boolean;
  enableConsoleColors: boolean;
  // New flag to control console output
  enableConsoleOutput: boolean;
}

// Define response type for log requests
export interface LogResponse {
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  status: boolean;
  total?: number; // Make total optional to match the shared interface
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logs: LogEntry[] = [];
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
    // Add subject for new log entries received via socket
  private newLogEntrySubject = new Subject<LogEntry>();
  public newLogEntry$ = this.newLogEntrySubject.asObservable();
  
  // Cast environment to specific type to access properties
  private readonly typedEnv = environment as unknown as {
    apiBaseUrl: string;
    apiUrl: string;
  };
  
  private readonly apiUrl = `${this.typedEnv.apiBaseUrl || this.typedEnv.apiUrl}/logs`;

  // Maximum number of logs to keep in memory
  private readonly maxLogSize = 1000;
  
  // Buffer for logs waiting to be sent to server
  private logBuffer: LogEntry[] = [];
  private bufferSize = 10;
  private autoSendInterval = 5000 // ms
  private autoSendTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Add the missing pendingLogs property to track logs that are still pending transmission
  private pendingLogs: LogEntry[] = [];

  private config: LoggerConfig = {
    level: LogLevel.INFO,
    includeTimestamp: true,
    enableConsoleColors: true,
    // Use environment configuration if available
    enableConsoleOutput: environment.logging?.enableConsole !== undefined ? 
      environment.logging.enableConsole : true
  };

  // Add SocketRegistryService to constructor
  constructor(
    private logDispatch: LogDispatchService,
    private socketRegistry: SocketRegistryService
  ) {
    // Initialize the logger without using console.log
    
    // Set log level from environment if available
    if (environment.logging?.level) {
      const envLevel = this.stringToLogLevel(environment.logging.level);
      if (envLevel !== undefined) {
        this.config.level = envLevel;
      }
    }
    
    // Check for log level override in localStorage
    const storedLevel = localStorage.getItem('log_level');
    if (storedLevel && Object.values(LogLevel).includes(Number(storedLevel))) {
      this.config.level = Number(storedLevel) as LogLevel;
    }

    // Start auto-send timer if configured
    if (this.autoSendInterval > 0) {
      this.startAutoSend();
    }
    
    // Generate some initial test logs
    this.generateTestLogs();
    
    // After initialization, now we can safely log
    this.info('LoggerService initialized', 'LoggerService');
    
    // Subscribe to socket for real-time logs
    this.setupSocketConnection();
  }

  // Convert string log level to enum value
  private stringToLogLevel(level: string): LogLevel | undefined {
    switch (level.toLowerCase()) {
      case 'trace': return LogLevel.TRACE;
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn':
      case 'warning': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': return LogLevel.FATAL;
      case 'off': return LogLevel.OFF;
      default: return undefined;
    }
  }

  private startAutoSend(): void {
    this.autoSendTimer = setInterval(() => {
      this.flushBuffer();
    }, this.autoSendInterval);
  }

  /**
   * Get logs as an observable
   */
  getLogs(): Observable<LogEntry[]> {
    return this.logsSubject.asObservable();
  }

  /**
   * Fetch logs from the server
   */
  fetchLogs(filter?: LogFilter): Observable<LogResponse> {
    // Convert filter to params or use empty object if undefined
    const params = filter ? this.buildFilterParams(filter) : {};
    return this.logDispatch.fetchLogs(params).pipe(
      tap(response => {
        // Update local logs
        this.logs = [...response.logs];
        this.notifySubscribers();
      })
    );
  }

  /**
   * Build filter parameters
   */
  private buildFilterParams(filter: LogFilter): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Use level instead of levels
    if (filter.level) {
      // Convert enum to string using the shared helper function
      if (Array.isArray(filter.level)) {
        params['level'] = filter.level.map(l => logLevelEnumToString(l)).join(',');
      } else {
        params['level'] = logLevelEnumToString(filter.level);
      }
    }
    
    // Handle service instead of sources
    if (filter.service) {
      params['service'] = filter.service;
    }
    
    // Use startDate instead of startTime
    if (filter.startDate) {
      params['startDate'] = filter.startDate;
    }
    
    // Use endDate instead of endTime
    if (filter.endDate) {
      params['endDate'] = filter.endDate;
    }
    
    if (filter.search) {
      params['search'] = filter.search;
    }
    
    if (filter.limit) {
      params['limit'] = filter.limit.toString();
    }
    
    // Use skip instead of offset
    if (filter.skip) {
      params['skip'] = filter.skip.toString();
    }
    
    return params;
  }

  /**
   * Add a log entry to the local store and optionally send to server
   */
  logMessage(level: LogLevelType, message: string, source: string = 'app', data?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: stringToLogLevelEnum(level),
      message,
      source,
      data
    };

    // Add to local logs
    this.addLog(entry);
    
    // Instead of batching, send each log immediately
    this.sendLogToServer(entry);
    
    // Return the log entry
    return entry;
  }

  /** Simple unique-id generator to replace uuid() */
  private generateId(): string {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 8)
    );
  }

  /**
   * Generate random test logs for development
   */
  generateTestLogs(count: number = 10, level: LogLevelType | 'random' = 'random'): void {
    if (level === 'random') {
      const levels: LogLevelType[] = ['debug', 'info', 'warning', 'error'];
      
      // Create complex debug logs
      this.logMessage(
        'debug',
        'TESTING: Application initialization completed',
        'testing',
        { 
          initTime: 1235.45,
          modules: ['CoreModule', 'AuthModule', 'DashboardModule'],
          configuration: {
            environment: 'development',
            features: {
              darkMode: true,
              analytics: false,
              experimental: true
            }
          }
        }
      );
      
      this.logMessage(
        'debug',
        'TESTING: API response time analysis',
        'testing',
        { 
          endpoint: '/api/metrics',
          responseTime: 235.42,
          samplingMethod: 'average',
          sampleSize: 50,
          details: {
            min: 120.23,
            max: 350.67,
            median: 228.45,
            percentile95: 312.87
          }
        }
      );
      
      // Create complex error logs
      this.logMessage(
        'error',
        'TESTING: Database connection failed',
        'testing',
        { 
          connectionId: 'db-conn-39a45f',
          attemptCount: 3,
          lastAttempt: new Date().toISOString(),
          error: {
            code: 'ECONNREFUSED',
            message: 'Unable to connect to database server',
            details: 'Connection timeout after 5000ms'
          },
          stackTrace: 'Error: ECONNREFUSED at DatabaseService.connect (database.service.ts:58:23)...'
        }
      );
      
      this.logMessage(
        'error',
        'TESTING: JWT token validation failed',
        'testing',
        { 
          tokenId: 'eyJhbGciOiJIUzI1NiIsIn...[truncated]',
          issueType: 'TokenExpiredError',
          expiredAt: new Date().toISOString(),
          requestContext: {
            url: '/api/secure-resource',
            method: 'GET',
            clientIp: '192.168.1.105',
            userId: 'anonymous'
          },
          securityContext: {
            severity: 'high',
            action: 'deny-access',
            auditTrail: true
          }
        }
      );
      
      // Generate random logs as normal
      for (let i = 0; i < count; i++) {
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        this.logMessage(
          randomLevel,
          `Test ${randomLevel} log message ${i + 1}`,
          randomLevel === 'error' || randomLevel === 'debug' ? 'testing' : 'test-generator',
          { testId: i, random: Math.random() }
        );
      }
    } else {
      for (let i = 0; i < count; i++) {
        this.logMessage(
          level,
          `TESTING: ${level} message ${i + 1}`,
          'testing',
          { 
            testId: i, 
            timestamp: Date.now(),
            context: {
              action: `test-action-${i}`,
              component: `TestComponent${i}`,
              user: i % 2 === 0 ? 'admin' : 'user'
            }
          }
        );
      }
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param sourceOrMetadata Source component or metadata object
   * @param data Additional data to include
   */
  debug(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): LogEntry {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      return this.logMessage('debug', message, sourceOrMetadata as string, data);
    } else {
      return this.logMessage('debug', message, undefined, { ...sourceOrMetadata, ...data });
    }
  }
  
  /**
   * Log an info message
   * @param message Message to log
   * @param sourceOrMetadata Source component or metadata object
   * @param data Additional data to include
   */
  info(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): LogEntry {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      return this.logMessage('info', message, sourceOrMetadata as string, data);
    } else {
      return this.logMessage('info', message, undefined, { ...sourceOrMetadata, ...data });
    }
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param sourceOrMetadata Source component or metadata object
   * @param data Additional data to include
   */
  warning(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): LogEntry {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      return this.logMessage('warning', message, sourceOrMetadata as string, data);
    } else {
      return this.logMessage('warning', message, undefined, { ...sourceOrMetadata, ...data });
    }
  }
  
  /**
   * Log an error message
   * @param message Message to log
   * @param errorOrSource Error object, source component, or metadata object
   * @param data Additional data to include
   */
  error(message: string, errorOrSource?: Error | string | LogMetadata, data?: Record<string, unknown>): LogEntry {
    // Handle when errorOrSource is an Error object
    if (errorOrSource instanceof Error) {
      const errorData = {
        errorMessage: errorOrSource.message,
        errorName: errorOrSource.name,
        errorStack: errorOrSource.stack,
        ...data
      };
      return this.logMessage('error', message, undefined, errorData);
    }
    
    // Handle when errorOrSource is a string or LogMetadata
    if (typeof errorOrSource === 'string' || errorOrSource === undefined) {
      return this.logMessage('error', message, errorOrSource as string, data);
    } else {
      return this.logMessage('error', message, undefined, { ...errorOrSource, ...data });
    }
  }

  /**
   * Log a trace message (most detailed)
   */
  trace(message: string, metadata?: LogMetadata): LogEntry {
    return this.log(LogLevel.TRACE, message, metadata);
  }

  /**
   * Log a fatal message (unrecoverable errors)
   */
  fatal(message: string, metadata?: LogMetadata): LogEntry {
    return this.log(LogLevel.FATAL, message, metadata);
  }

  /**
   * Add a log entry to the local store and notify subscribers
   */
  private addLog(log: LogEntry): void {
    // Add log to the beginning of the array
    this.logs.unshift(log);
    
    // Limit size of logs array
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Flush log buffer to server - modified to not use batch endpoint
   * This is kept for backward compatibility but now processes logs individually
   */
  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;
    
    // Process one log at a time instead of sending the entire batch
    const logToSend = this.logBuffer.shift();
    if (logToSend) {
      this.sendLogToServer(logToSend);
    }
    
    // If we still have logs, schedule another flush
    if (this.logBuffer.length > 0) {
      setTimeout(() => this.flushBuffer(), 100);
    }
  }
  
  /**
   * Send a single log to the server - new method replacing batch processing
   */
  private sendLogToServer(log: LogEntry): void {
    this.logDispatch.sendLogs([log])
      .subscribe({
        next: (response) => {
          if (!response) {
            this.warning('No response received from log request', 'LoggerService');
            return;
          }
          
          if (response.success) {
            this.debug('Successfully sent log to server', 'LoggerService');
          } else {
            this.warning('Failed to send log to server', 'LoggerService');
            // Re-add log to buffer for next attempt
            this.logBuffer.push(log);
          }
        },
        error: (err) => {
          this.error('Error sending log', 'LoggerService', { error: err });
          // Re-add log to buffer for next attempt
          this.logBuffer.push(log);
        }
      });
  }

  /**
   * Notify subscribers of updated logs
   */
  private notifySubscribers(): void {
    this.logsSubject.next([...this.logs]);
  }

  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    localStorage.setItem('log_level', level.toString());
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): LogEntry {
    if (level < this.config.level) {
      // Create a minimal log entry for skipped logs
      return {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        level: this.mapLogLevelToLogLevelEnum(level),
        message,
        source: metadata?.service || 'LoggerService',
        data: metadata
      };
    }
    
    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : null;
    
    // Format the log message
    let formattedMessage = message;
    if (timestamp) {
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }
    
    // Create combined log data
    const logData = metadata ? { message, ...metadata } : { message };
    
    // Create a log entry
    const source = metadata?.service || 'LoggerService';
    
    // Map internal LogLevel to shared LogLevelEnum
    const logLevelEnum = this.mapLogLevelToLogLevelEnum(level);
    
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: logLevelEnum,
      message,
      source,
      data: metadata
    };
    
    // Add entry to logs
    this.addLog(entry);
    
    // Output to browser console without calling ourselves (to avoid recursion)
    // We use direct console methods to avoid recursive calls to our own logger
    const consoleData = this.config.enableConsoleColors ? logData : null;
    
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        this.writeToConsole('debug', formattedMessage, consoleData);
        break;
      case LogLevel.INFO:
        this.writeToConsole('info', formattedMessage, consoleData);
        break;
      case LogLevel.WARN:
        this.writeToConsole('warn', formattedMessage, consoleData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        this.writeToConsole('error', formattedMessage, consoleData);
        break;
    }
    
    return entry;
  }

  /**
   * Map internal LogLevel enum to the shared LogLevelEnum
   */
  private mapLogLevelToLogLevelEnum(level: LogLevel): LogLevelEnum {
    switch (level) {
      case LogLevel.TRACE: return LogLevelEnum.TRACE;
      case LogLevel.DEBUG: return LogLevelEnum.DEBUG;
      case LogLevel.INFO: return LogLevelEnum.INFO;
      case LogLevel.WARN: return LogLevelEnum.WARN;
      case LogLevel.ERROR: return LogLevelEnum.ERROR;
      case LogLevel.FATAL: return LogLevelEnum.FATAL;
      default: return LogLevelEnum.INFO;
    }
  }

  /**
   * Direct write to console to avoid recursive logging
   * This is the only place in the codebase where we should use console directly
   */
  private writeToConsole(method: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (this.config.enableConsoleOutput) {
      if (data) {
        console[method](message, data);
      } else {
        console[method](message);
      }
    }
  }
  
  /**
   * Convert LogLevel enum to string
   */
  private getLogLevelString(level: LogLevel): LogLevelType {
    switch (level) {
      case LogLevel.TRACE: return 'trace';
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warning';
      case LogLevel.ERROR: return 'error';
      case LogLevel.FATAL: return 'fatal';
      default: return 'info';
    }
  }
  
  /**
   * Set up socket connection to receive real-time logs
   */
  private setupSocketConnection(): void {
    // Attempt to get the socket - if it doesn't exist yet, try again after a delay
    const attemptConnection = () => {
      const logsSocket = this.socketRegistry.getSocket('/logs');
      
      if (logsSocket) {
        this.debug('Connected to logs socket', 'LoggerService');
        
        // Listen for new log entries
        logsSocket.on('log-entry', (logEntry: LogEntry) => {
          this.debug('Received log entry from server', 'LoggerService');
          // Add to local logs
          this.addLog(logEntry);
          // Emit via newLogEntry$ observable
          this.newLogEntrySubject.next(logEntry);
        });
        
        // Listen for log batches
        logsSocket.on('log-batch', (logEntries: LogEntry[]) => {
          this.debug(`Received batch of ${logEntries.length} logs from server`, 'LoggerService');
          // Add each log
          logEntries.forEach(log => {
            this.addLog(log);
            this.newLogEntrySubject.next(log);
          });
        });
      } else {
        // Socket not available yet, try again after a delay
        setTimeout(attemptConnection, 2000);
        this.debug('Logs socket not available yet, retrying in 2s', 'LoggerService');
      }
    };
    
    // Start the connection attempt
    attemptConnection();
  }

  /**
   * Get the latest logs from the source
   * Only fetch logs newer than the most recent one we have
   */
  getLatestLogs(): Observable<LogEntry[]> {
    // If we have logs, get the timestamp of the most recent one
    let params: Record<string, string> = {};
    if (this.logs.length > 0) {
      const mostRecentTimestamp = this.logs[0].timestamp;
      params = {
        'afterTimestamp': mostRecentTimestamp
      };
    }

    // Otherwise just fetch the most recent logs
    return this.logDispatch.fetchLogs(params).pipe(
      tap(response => {
        // If we got new logs, add them to our local cache
        if (response.logs.length > 0) {
          // Add each new log to the beginning
          const newLogs = response.logs.filter(newLog => 
            !this.logs.some(existingLog => existingLog.id === newLog.id)
          );
          
          if (newLogs.length > 0) {
            this.debug(`Got ${newLogs.length} new logs from server`, 'LoggerService');
            
            // Add to the beginning of our logs array
            this.logs = [...newLogs, ...this.logs];
            
            // Limit size
            if (this.logs.length > this.maxLogSize) {
              this.logs = this.logs.slice(0, this.maxLogSize);
            }
            
            this.notifySubscribers();
          } else {
            this.debug('No new logs from server', 'LoggerService');
          }
        }
      }),
      map(() => this.logs)
    );
  }

  /**
   * Filter logs using the base LogFilter interface
   * This method provides backward compatibility with systems using the basic LogFilter interface
   * 
   * @param filter Basic log filter criteria
   * @returns Filtered logs matching the criteria
   */
  filterLogsByBasicFilter(filter: LogFilter): LogEntry[] {
    // Start with all logs
    let filteredLogs = [...this.logs];
    
    // Apply level filter 
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        filteredLogs = filteredLogs.filter(log => 
          filter.level && Array.isArray(filter.level) && filter.level.includes(log.level)
        );
      } else {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
    }
    
    // Apply service filter if provided
    if (filter.service) {
      filteredLogs = filteredLogs.filter(log => log.source === filter.service);
    }
    
    // Apply date range filters if provided
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
    
    // Apply search filter if provided
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchLower) || 
        (log.source && log.source.toLowerCase().includes(searchLower)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }
    
    return filteredLogs;
  }
}
