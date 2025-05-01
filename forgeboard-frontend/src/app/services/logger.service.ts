import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { LogEntry, LogLevelType, LogFilter, LogResponse } from '@forge-board/shared/api-interfaces';

/**
 * Log levels supported by the logger
 */
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
export interface LoggerConfig {
  level: LogLevel;
  includeTimestamp: boolean;
  enableConsoleColors: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logs: LogEntry[] = [];
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  private readonly apiUrl = 'http://localhost:3000/api/logs';

  // Maximum number of logs to keep in memory
  private readonly maxLogSize = 1000;
  
  // Buffer for logs waiting to be sent to server
  private logBuffer: LogEntry[] = [];
  private bufferSize = 10;
  private autoSendInterval = 5000; // ms
  private autoSendTimer: ReturnType<typeof setTimeout> | null = null; // Initialize to avoid TS2564

  private config: LoggerConfig = {
    level: LogLevel.INFO,
    includeTimestamp: true,
    enableConsoleColors: true
  };

  constructor(private http: HttpClient) {
    console.log('LoggerService initialized');
    
    // Check for log level in environment or localStorage
    const envLevel = localStorage.getItem('log_level');
    if (envLevel && Object.values(LogLevel).includes(Number(envLevel))) {
      this.config.level = Number(envLevel) as LogLevel;
    }

    // Start auto-send timer if configured
    if (this.autoSendInterval > 0) {
      this.startAutoSend();
    }
    
    // Generate some initial test logs
    this.generateTestLogs();
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
    return this.http.get<LogResponse>(`${this.apiUrl}`, { params: { ...filter } }).pipe(
      tap(response => {
        // Update local logs
        this.logs = [...response.logs];
        this.notifySubscribers();
      }),
      catchError(error => {
        console.error('Error fetching logs:', error);
        return of({ 
          logs: [], 
          totalCount: 0, 
          filtered: false,
          status: false,
          total: 0,
          timestamp: new Date().toISOString()
        } as LogResponse);
      })
    );
  }

  /**
   * Add a log entry to the local store and optionally send to server
   */
  logMessage(level: LogLevelType, message: string, source: string = 'app', data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: uuid(), // Now using the uuid function
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      data
    };

    // Add to local logs
    this.addLog(entry);
    
    // Add to buffer for sending to server
    this.logBuffer.push(entry);
    
    // If buffer is full, send logs to server
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Generate random test logs for development
   */
  generateTestLogs(count: number = 10, level: LogLevelType | 'random' = 'random'): void {
    if (level === 'random') {
      const levels: LogLevelType[] = ['debug', 'info', 'warning', 'error'];
      for (let i = 0; i < count; i++) {
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        this.logMessage(
          randomLevel,
          `Test log message ${i + 1}`,
          'test-generator',
          { testId: i, random: Math.random() }
        );
      }
    } else {
      for (let i = 0; i < count; i++) {
        this.logMessage(
          level,
          `Test ${level} log message ${i + 1}`,
          'test-generator',
          { testId: i }
        );
      }
    }
  }

  /**
   * Log a debug message (older API)
   */
  debug(message: string, source?: string, data?: Record<string, unknown>): void;
  /**
   * Log a debug message (detailed diagnostics)
   */
  debug(message: string, metadata?: LogMetadata): void;
  /**
   * Debug implementation that handles both versions
   */
  debug(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): void {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      this.logMessage('debug' as LogLevelType, message, sourceOrMetadata, data);
    } else {
      this.log(LogLevel.DEBUG, message, sourceOrMetadata);
    }
  }

  /**
   * Log an info message (older API)
   */
  info(message: string, source?: string, data?: Record<string, unknown>): void;
  /**
   * Log an info message (normal operations)
   */
  info(message: string, metadata?: LogMetadata): void;
  /**
   * Info implementation that handles both versions
   */
  info(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): void {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      this.logMessage('info' as LogLevelType, message, sourceOrMetadata, data);
    } else {
      this.log(LogLevel.INFO, message, sourceOrMetadata);
    }
  }

  /**
   * Log a warning message (older API)
   */
  warning(message: string, source?: string, data?: Record<string, unknown>): void;
  /**
   * Log a warning message (potential issues)
   */
  warning(message: string, metadata?: LogMetadata): void;
  /**
   * Warning implementation that handles both versions
   */
  warning(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): void {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      this.logMessage('warning' as LogLevelType, message, sourceOrMetadata, data);
    } else {
      this.log(LogLevel.WARN, message, sourceOrMetadata);
    }
  }
  
  /**
   * Alias for warning method (older API)
   */
  warn(message: string, source?: string, data?: Record<string, unknown>): void;
  /**
   * Alias for warning method (newer API)
   */
  warn(message: string, metadata?: LogMetadata): void;
  /**
   * Warn implementation that delegates to warning
   */
  warn(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): void {
    this.warning(message, typeof sourceOrMetadata === 'string' ? sourceOrMetadata : undefined, data);
  }

  /**
   * Log an error message (older API)
   */
  error(message: string, source?: string, data?: Record<string, unknown>): void;
  /**
   * Log an error message (recoverable errors)
   */
  error(message: string, metadata?: LogMetadata): void;
  /**
   * Error implementation that handles both versions
   */
  error(message: string, sourceOrMetadata?: string | LogMetadata, data?: Record<string, unknown>): void {
    if (typeof sourceOrMetadata === 'string' || sourceOrMetadata === undefined) {
      this.logMessage('error' as LogLevelType, message, sourceOrMetadata, data);
    } else {
      this.log(LogLevel.ERROR, message, sourceOrMetadata);
    }
  }

  /**
   * Log a trace message (most detailed)
   */
  trace(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

  /**
   * Log a fatal message (unrecoverable errors)
   */
  fatal(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.FATAL, message, metadata);
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
   * Flush log buffer to server
   */
  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];
    
    console.log(`Sending ${logsToSend.length} logs to server`);
    
    // Completely bypass TypeDiagnostics validation by using HttpClient directly
    // with observe: 'response' option to get the full response object
    this.http.post(`${this.apiUrl}/batch`, logsToSend, { 
      observe: 'response',
      // Prevents Angular from trying to parse the response as JSON
      responseType: 'text'
    })
      .pipe(
        catchError(error => {
          console.error('Error sending logs to server:', error);
          // Re-add logs to buffer for next attempt
          this.logBuffer = [...logsToSend, ...this.logBuffer];
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (!response) {
            console.warn('No response received from log batch request');
            return;
          }
          
          // Check response status code first
          if (response.ok) {
            // Success case - we don't need to do anything with the response body
            console.debug('Successfully sent logs to server');
          } else {
            console.warn(`Failed to send logs to server: HTTP ${response.status}`);
            // Re-add logs to buffer for next attempt
            this.logBuffer = [...logsToSend, ...this.logBuffer];
          }
        },
        error: (error) => {
          console.error('Error in log batch response:', error);
          // Re-add logs to buffer for next attempt
          this.logBuffer = [...logsToSend, ...this.logBuffer];
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
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (level < this.config.level) return;
    
    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : null;
    
    // Format the log message
    let formattedMessage = message;
    if (timestamp) {
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }
    
    // Create combined log data
    const logData = metadata ? { message, ...metadata } : { message };
    
    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formattedMessage, logData);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, logData);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, logData);
        break;
    }
  }
}
