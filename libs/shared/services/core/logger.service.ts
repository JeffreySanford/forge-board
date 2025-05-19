// Shared LoggerService for both frontend and backend (framework-agnostic)
// This class is not decorated with Angular or NestJS decorators.
// It can be extended or composed in framework-specific services.
import { BehaviorSubject, Observable, of } from 'rxjs';
import { 
  LogEntry, 
  LogLevelEnum, 
  LogFilter, 
  LogQueryResponse,
  LogStatsResult
} from '@forge-board/shared/api-interfaces';
import { v4 as uuidv4 } from 'uuid';

export class SharedLoggerService {
  protected logsSubject = new BehaviorSubject<LogEntry[]>([]);
  protected logStatsSubject = new BehaviorSubject<Record<LogLevelEnum, number>>({
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 0,
    [LogLevelEnum.WARN]: 0,
    [LogLevelEnum.ERROR]: 0,
    [LogLevelEnum.FATAL]: 0,
    [LogLevelEnum.TRACE]: 0
  });

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: LogFilter): Observable<LogEntry[]> {
    if (!filter || Object.keys(filter).length === 0) {
      return this.logsSubject.asObservable();
    }

    return of(this.filterLogs(filter));
  }

  getLogStats(): Observable<Record<LogLevelEnum, number>> {
    return this.logStatsSubject.asObservable();
  }

  /**
   * Add a single log entry to the store
   */
  addLog(entry: LogEntry): void {
    const logs = [entry, ...this.logsSubject.getValue()];
    this.logsSubject.next(logs);
    const stats = { ...this.logStatsSubject.getValue() };
    stats[entry.level] = (stats[entry.level] || 0) + 1;
    this.logStatsSubject.next(stats);
  }

  /**
   * Add multiple logs at once
   */
  addLogs(logs: LogEntry[]): Observable<LogEntry[]> {
    if (!logs || !logs.length) {
      return of([]);
    }

    const processedLogs: LogEntry[] = logs.map(log => ({
      ...log,
      id: log.id || uuidv4(),
      timestamp: log.timestamp || new Date().toISOString(),
    }));

    // Add each log to the store
    processedLogs.forEach(log => this.addLog(log));

    return of(processedLogs);
  }

  /**
   * Delete logs with optional filtering
   * Returns the number of logs deleted
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

    // Apply filter to keep only logs that don't match the filter
    logsToKeep = currentLogs.filter(log => !this.logMatchesFilter(log, filter));

    const deletedCount = currentLogs.length - logsToKeep.length;
    this.logsSubject.next(logsToKeep);
    
    // Update stats
    this.updateLogStats();

    return of(deletedCount);
  }

  /**
   * Delete a specific log by ID
   */
  deleteLog(id: string): Observable<boolean> {
    const currentLogs = this.logsSubject.getValue();
    const filteredLogs = currentLogs.filter(log => log.id !== id);
    
    if (filteredLogs.length === currentLogs.length) {
      // No log was removed
      return of(false);
    }
    
    this.logsSubject.next(filteredLogs);
    this.updateLogStats();
    return of(true);
  }

  /**
   * Clear all logs
   */
  clearLogs(filter?: LogFilter): Observable<number> {
    return this.deleteLogs(filter);
  }

  /**
   * Update log statistics after changes
   */
  private updateLogStats(): void {
    const logs = this.logsSubject.getValue();
    const stats = {
      [LogLevelEnum.DEBUG]: 0,
      [LogLevelEnum.INFO]: 0,
      [LogLevelEnum.WARN]: 0,
      [LogLevelEnum.ERROR]: 0,
      [LogLevelEnum.FATAL]: 0,
      [LogLevelEnum.TRACE]: 0
    };
    
    logs.forEach(log => {
      stats[log.level] = (stats[log.level] || 0) + 1;
    });
    
    this.logStatsSubject.next(stats);
  }

  /**
   * Apply a filter to logs
   */
  filterLogs(filter: LogFilter): LogEntry[] {
    return this.logsSubject.getValue().filter(log => this.logMatchesFilter(log, filter));
  }

  /**
   * Check if a log matches a filter
   */
  protected logMatchesFilter(log: LogEntry, filter: LogFilter): boolean {
    // Level filter
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        if (!filter.level.includes(log.level)) {
          return false;
        }
      } else if (log.level !== filter.level) {
        return false;
      }
    }
    
    // Source filter
    if (filter.service && log.source !== filter.service) {
      return false;
    }
    
    // Date range filter
    if (filter.startDate || filter.endDate) {
      const logTime = new Date(log.timestamp).getTime();
      
      if (filter.startDate && logTime < new Date(filter.startDate).getTime()) {
        return false;
      }
      
      if (filter.endDate && logTime > new Date(filter.endDate).getTime()) {
        return false;
      }
    }

    // After timestamp filter
    if (filter.afterTimestamp && log.timestamp <= filter.afterTimestamp) {
      return false;
    }
    
    // Search filter
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matchesMessage = log.message && log.message.toLowerCase().includes(search);
      const matchesContext = log.context && log.context.toLowerCase().includes(search);
      const matchesSource = log.source && log.source.toLowerCase().includes(search);
      
      if (!(matchesMessage || matchesContext || matchesSource)) {
        return false;
      }
    }
    
    return true;
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
      logs: paginatedLogs,
      totalCount: allLogs.length,
      filteredCount: filteredLogs.length,
      page,
      limit,
      status: true,
      filtered: Object.keys(filter).length > 0,
      timestamp: new Date().toISOString(),
    } as LogQueryResponse);
  }

  /**
   * Get statistics about logs
   */
  getLogStatistics(filter?: LogFilter): Observable<LogStatsResult> {
    const logs = filter ? this.filterLogs(filter) : this.logsSubject.getValue();
    
    // Initialize stats counters
    const byLevel: Record<LogLevelEnum, number> = {
      [LogLevelEnum.TRACE]: 0,
      [LogLevelEnum.DEBUG]: 0,
      [LogLevelEnum.INFO]: 0,
      [LogLevelEnum.WARN]: 0,
      [LogLevelEnum.ERROR]: 0,
      [LogLevelEnum.FATAL]: 0
    };
    
    const bySource: Record<string, number> = {};
    
    // Calculate statistics
    logs.forEach(log => {
      // Count by level
      if (log.level) {
        byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      }
      
      // Count by source
      if (log.source) {
        bySource[log.source] = (bySource[log.source] || 0) + 1;
      }
    });
    
    // Find earliest and latest timestamps if logs exist
    let timeRange;
    if (logs.length > 0) {
      const timestamps = logs.map(log => new Date(log.timestamp).getTime());
      timeRange = {
        earliest: new Date(Math.min(...timestamps)).toISOString(),
        latest: new Date(Math.max(...timestamps)).toISOString()
      };
    }
    
    return of({
      totalLogs: logs.length,
      byLevel,
      bySource,
      timeRange,
      totalCount: logs.length
    });
  }
}
