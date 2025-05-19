import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { 
  LogEntry, 
  LogLevelEnum, 
  LogFilter, 
  LogQueryResponse,
  LogStatsResult 
} from '@forge-board/shared/api-interfaces';
import { SharedLoggerService } from '@forge-board/shared/services/core/logger.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logger service for the backend application. 
 * Extends the shared logger service with NestJS-specific functionality.
 */
@Injectable()
export class LoggerService extends SharedLoggerService {
  // Subject for new log entries - both components can subscribe
  public readonly newLogEntry$ = new Subject<LogEntry>();
  // Batched log entries for performance
  public readonly batchedNewLogEntries$ = new BehaviorSubject<LogEntry[]>([]);

  // Cached logs for quick access
  private readonly logBatchSize = 20;
  private logBatch: LogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Set up subscription to forward individual logs to batch processing
    this.newLogEntry$.subscribe(log => {
      this.addToBatch(log);
    });
  }

  /**
   * Add log to batch for efficient emission
   */
  private addToBatch(log: LogEntry): void {
    this.logBatch.push(log);
    
    if (this.logBatch.length >= this.logBatchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // Start a timer to flush the batch if it doesn't fill up quickly
      this.batchTimer = setTimeout(() => this.flushBatch(), 1000);
    }
  }

  /**
   * Flush the batch of logs to subscribers
   */
  private flushBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logBatch.length > 0) {
      this.batchedNewLogEntries$.next([...this.logBatch]);
      this.logBatch = [];
    }
  }

  /**
   * Log a message at the specified level
   * @param level LogLevelEnum level
   * @param message The message to log
   * @param context Optional context (e.g., service name)
   * @param details Optional details object
   */
  log(level: LogLevelEnum, message: string, context?: string, details?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: uuidv4(),
      level,
      message,
      timestamp: new Date().toISOString(),
      source: context || 'api',
      context,
      details
    };
    
    this.addLog(entry);
    // Also emit the new log entry
    this.newLogEntry$.next(entry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, details?: Record<string, unknown>): void {
    this.log(LogLevelEnum.DEBUG, message, context, details);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, details?: Record<string, unknown>): void {
    this.log(LogLevelEnum.INFO, message, context, details);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, details?: Record<string, unknown>): void {
    this.log(LogLevelEnum.WARN, message, context, details);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, details?: Record<string, unknown>, stackTrace?: string): void {
    this.log(LogLevelEnum.ERROR, message, context, { ...details, stackTrace });
  }

  /**
   * Add multiple log entries at once
   * @param logs Array of log entries
   */
  addLogs(logs: LogEntry[]): Observable<LogEntry[]> {
    if (!Array.isArray(logs) || logs.length === 0) {
      return throwError(() => new Error('Invalid logs array'));
    }
    
    // Add timestamp and ID if missing
    const processedLogs = logs.map(log => ({
      ...log,
      id: log.id || uuidv4(),
      timestamp: log.timestamp || new Date().toISOString()
    }));
    
    // Add each log to the store
    processedLogs.forEach(log => {
      this.addLog(log);
      // Also emit each new log entry
      this.newLogEntry$.next(log);
    });
    
    return of(processedLogs);
  }

  /**
   * Get logs with optional filtering
   * @param filter Optional filter criteria
   */
  getLogs(filter?: LogFilter): Observable<LogEntry[]> {
    if (!filter || Object.keys(filter).length === 0) {
      return this.logsSubject.asObservable();
    }
    
    return of(this.filterLogs(filter));
  }

  /**
   * Get a specific log by ID
   */
  getLogById(id: string): Observable<LogEntry | undefined> {
    const logs = this.logsSubject.getValue();
    const log = logs.find(l => l.id === id);
    return of(log);
  }

  /**
   * Delete logs matching a filter
   * @param filter Filter criteria for logs to delete
   */
  deleteLogs(filter?: LogFilter): Observable<number> {
    const currentLogs = this.logsSubject.getValue();
    let logsToKeep: LogEntry[];
    
    if (!filter || Object.keys(filter).length === 0) {
      // Delete all logs if no filter provided
      const count = currentLogs.length;
      this.logsSubject.next([]);
      return of(count);
    }
    
    // Filter logs to keep (inverse of filter)
    logsToKeep = currentLogs.filter(log => {
      if (filter.level && log.level === filter.level) return false;
      if (filter.service && log.source === filter.service) return false;
      if (filter.search && log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.startDate && new Date(log.timestamp) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(log.timestamp) > new Date(filter.endDate)) return false;
      return true;
    });
    
    const deletedCount = currentLogs.length - logsToKeep.length;
    this.logsSubject.next(logsToKeep);
    
    return of(deletedCount);
  }

  /**
   * Query logs with pagination and filtering
   */
  queryLogs(filter: LogFilter, page = 0, limit = 100): Observable<LogQueryResponse> {
    const allLogs = this.logsSubject.getValue();
    const filteredLogs = this.filterLogs(filter);
    
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return of({
      status: true,
      logs: paginatedLogs,
      totalCount: allLogs.length,
      filtered: Object.keys(filter).length > 0,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.newLogEntry$.complete();
    this.logBatch = [];
  }

  /**
   * Start metrics timer for automatic updates
   */
  startMetricsTimer(): void {
    // Implementation depends on your requirements
  }

  /**
   * Update the interval for metrics updates
   */
  setUpdateInterval(interval: number): Observable<number> {
    this.updateInterval = Math.max(interval, 20);
    
    // Restart the timer with the new interval
    this.startMetricsTimer();
    
    return of(this.updateInterval);
  }

  /**
   * Add a single log entry to the store and notify subscribers
   */
  addLog(entry: LogEntry): void {
    super.addLog(entry);
    // Also emit the new log entry
    this.newLogEntry$.next(entry);
  }

  /**
   * Alias for warn to fix any typo in clients
   */
  warning(message: string, context?: string, details?: Record<string, unknown>): void {
    this.warn(message, context, details);
  }

  /**
   * Get log statistics grouped by level and source
   */
  getLogStatistics(filter?: LogFilter): Observable<LogStatsResult> {
    const logs = this.filterLogs(filter || {});
    
    const stats: LogStatsResult = {
      totalLogs: logs.length,
      byLevel: {
        [LogLevelEnum.DEBUG]: 0,
        [LogLevelEnum.INFO]: 0,
        [LogLevelEnum.WARN]: 0,
        [LogLevelEnum.ERROR]: 0,
        [LogLevelEnum.FATAL]: 0,
        [LogLevelEnum.TRACE]: 0
      },
      bySource: {},
      totalCount: logs.length
    };
    
    // Count logs by level and source
    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by source
      const source = log.source || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });
    
    return of(stats);
  }

  /**
   * Clear all logs - alias for deleteLogs for compatibility
   */
  clearLogs(filter?: LogFilter): Observable<number> {
    return this.deleteLogs(filter);
  }

  /**
   * Delete a specific log by ID
   */
  deleteLog(id: string): Observable<boolean> {
    return super.deleteLog(id);
  }
}
