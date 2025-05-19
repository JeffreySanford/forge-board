import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { SharedLoggerService } from '@forge-board/shared/services/core/logger.service';
import { v4 as uuidv4 } from 'uuid';
import {
  LogEntry,
  LogFilter,
  LogLevelEnum,
  LogQueryResponse,
} from '@forge-board/shared/api-interfaces/lib/log/log.interface';

/**
 * Get statistics about logs
 */
interface LogStatistics {
  totalCount: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}
/**
 * Logger service for the backend application.
 * Extends the shared logger service with NestJS-specific functionality.
 */
@Injectable()
export class LoggerService extends SharedLoggerService {
  logsSubject: any;
  // Inherits logsSubject from SharedLoggerService

  /**
   * Log a message at the specified level
   * @param level LogLevelEnum level
   * @param message The message to log
   * @param context Optional context (e.g., service name)
   * @param details Optional details object
   */
  log(
    level: LogLevelEnum,
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: uuidv4(),
      level,
      message,
      timestamp: new Date().toISOString(),
      source: context || 'api',
      context,
      details,
    };

    this.addLogs([entry]);
  } // Use the inherited addLog method from SharedLoggerService

  getLogStatistics(filter?: LogFilter): Observable<LogStatistics> {
    const logs = filter ? this.filterLogs(filter) : this.logsSubject.getValue();

    // Count logs by level
    const byLevel: Record<string, number> = {};
    // Count logs by source
    const bySource: Record<string, number> = {};

    logs.forEach((log) => {
      // Count by level
      const level = log.level.toString();
      byLevel[level] = (byLevel[level] || 0) + 1;

      // Count by source
      const source = log.source || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
    });

    return of({
      totalCount: logs.length,
      byLevel,
      bySource,
    });
  }

  /**
   * Clears all logs or logs matching a filter
   */
  clearLogs(filter?: LogFilter): Observable<number> {
    return this.deleteLogs(filter);
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevelEnum.DEBUG,
      message,
      source: 'api',
      context,
      details,
    };

    this.addLogs([entry]);
  }

  /**
   * Log an info message
   */
  info(
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevelEnum.INFO,
      message,
      source: 'api',
      context,
      details,
    };

    this.addLogs([entry]);  
  }

  /**
   * Log a warn message
   */
  warn(
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevelEnum.WARN,
      message,
      source: 'api',
      context,
      details,
    };

    this.addLogs([entry]);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevelEnum.ERROR,
      message,
      source: 'api',
      context,
      details,
    };

    this.addLogs([entry]);
  }

  /**
   * Alias for warn to fix typo in socket.gateway.ts
   */
  warning(
    message: string,
    context?: string,
    details?: Record<string, unknown>
  ): void {
    this.warn(message, context, details);
  }

  /**
   * Add multiple logs at once
   */
  addLogs(logs: LogEntry[]): Observable<LogEntry[]> {
    if (!logs || !logs.length) {
      return of([]);
    }

    const processedLogs: LogEntry[] = logs.map((log) => ({
      ...log,
      id: log.id || uuidv4(),
      timestamp: log.timestamp || new Date().toISOString(),
    }));

    // Add logs to the store
    const currentLogs = this.logsSubject.getValue();
    this.logsSubject.next([...currentLogs, ...processedLogs]);

    return of(processedLogs);
  }
  /**
   * Filter logs by criteria
   * Implementation provided to match the interface.
   */
  protected filterLogs(filter: LogFilter): LogEntry[] {
    return this.logsSubject.getValue().filter((log) => {
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

        if (
          filter.startDate &&
          logTime < new Date(filter.startDate).getTime()
        ) {
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
        const matchesMessage =
          log.message && log.message.toLowerCase().includes(search);
        const matchesContext =
          log.context && log.context.toLowerCase().includes(search);
        const matchesSource =
          log.source && log.source.toLowerCase().includes(search);

        if (!(matchesMessage || matchesContext || matchesSource)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: LogFilter): Observable<LogEntry[]> {
    if (!filter || Object.keys(filter).length === 0) {
      return this.logsSubject.asObservable();
    }

    return of(this.filterLogs(filter));
  }
  /**
   * Delete logs with optional filtering
   */
  deleteLogs(filter?: LogFilter): Observable<number> {
    const currentLogs = this.logsSubject.getValue();

    if (!filter || Object.keys(filter).length === 0) {
      // Delete all logs if no filter provided
      const count = currentLogs.length;
      this.logsSubject.next([]);
      return of(count);
    }

    // Apply filter to keep only logs that don't match the filter
    const logsToKeep = currentLogs.filter(
      (log) => !this.logMatchesFilter(log, filter)
    );

    const deletedCount = currentLogs.length - logsToKeep.length;
    this.logsSubject.next(logsToKeep);

    return of(deletedCount);
  }

  /**
   * Check if a log matches a filter criteria
   */
  private logMatchesFilter(log: LogEntry, filter: LogFilter): boolean {
    // Same implementation as in filterLogs
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        if (!filter.level.includes(log.level)) {
          return false;
        }
      } else if (log.level !== filter.level) {
        return false;
      }
    }

    if (filter.service && log.source !== filter.service) {
      return false;
    }

    if (filter.startDate || filter.endDate) {
      const logTime = new Date(log.timestamp).getTime();

      if (filter.startDate && logTime < new Date(filter.startDate).getTime()) {
        return false;
      }

      if (filter.endDate && logTime > new Date(filter.endDate).getTime()) {
        return false;
      }
    }

    if (filter.afterTimestamp && log.timestamp <= filter.afterTimestamp) {
      return false;
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matchesMessage =
        log.message && log.message.toLowerCase().includes(search);
      const matchesContext =
        log.context && log.context.toLowerCase().includes(search);
      const matchesSource =
        log.source && log.source.toLowerCase().includes(search);

      if (!(matchesMessage || matchesContext || matchesSource)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Query logs with pagination and filtering
   */ queryLogs(
    filter: LogFilter,
    page = 0,
    limit = 100
  ): Observable<LogQueryResponse> {
    const filteredLogs = this.filterLogs(filter);

    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return of({
      logs: paginatedLogs,
      totalCount: filteredLogs.length,
      filtered: Object.keys(filter).length > 0,
      timestamp: new Date().toISOString(),
      status: true,
    });
  }
}
