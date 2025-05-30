import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  Subject,
  Subscription,
  throwError,
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LogEntry,
  LogLevelEnum,
  LogFilter,
  LogResponse,
} from '@forge-board/shared/api-interfaces'; // Added LogResponse
import { LogDispatchService } from './log-dispatch.service';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root', // This ensures it's available as a singleton throughout the app
})
export class LoggerService implements OnDestroy {
  private readonly MAX_LOG_RECORDS = 1000;

  // Stream of all log entries
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  logs$ = this.logsSubject.asObservable();

  // Stream of filtered log entries
  private filteredLogsSubject = new BehaviorSubject<LogEntry[]>([]);
  filteredLogs$ = this.filteredLogsSubject.asObservable();

  // Subject for emitting new logs as they come in
  private newLogSubject = new Subject<LogEntry>();
  newLog$ = this.newLogSubject.asObservable();

  // Socket connection for real-time logs
  private socket: Socket | null = null;

  // Collection for storing all subscriptions for cleanup
  private subscriptions = new Subscription();

  // Current log filter
  private filter: LogFilter = {};
  mockDataGeneration = false;

  constructor(
    private http: HttpClient,
    private logDispatchService: LogDispatchService
  ) {
    this.initSocketConnection();
  }

  ngOnDestroy(): void {
    // Clean up socket
    this.cleanupSocket();

    // Complete subjects
    this.logsSubject.complete();
    this.filteredLogsSubject.complete();
    this.newLogSubject.complete();

    // Stop mock data generation if active
    this.stopMockDataGeneration();

    this.subscriptions.unsubscribe();
  }
  /**
   * Log a debug message - console logging version
   * @param message Message content
   * @param params Optional parameters/metadata
   */
  private logConsole(
    level: LogLevelEnum,
    message: string,
    ...params: unknown[]
  ): void {
    // Implementation for console logging
    console[LogLevelEnum[level].toLowerCase()](message, ...params);
  }

  /**
   * Clean up socket connections
   */
  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('log-stream');
      this.socket.off('log-batch');
      this.socket.off('backend-log-entry');

      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
  }

  stopMockDataGeneration(): void {
    // Stop any mock data generation if applicable
    if (this.mockDataGeneration) {
      this.mockDataGeneration = false;
    }
  }

  private initSocketConnection(): void {
    try {
      // Get API URL from environment or use default
      const socketUrl = 'http://localhost:3000'; // Using hardcoded URL instead of environment

      this.socket = io(`${socketUrl}/logs`, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Socket event listeners
      this.socket.on('connect', () => {
        console.log('Connected to logs socket');
        // Subscribe to server logs on connection
        this.subscribeToServerLogs();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from logs socket');
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      this.socket.on('log-batch', (response) => {
        if (response.status === 'success') {
          const logBatch = response.data;
          this.processBatchLogs(logBatch);
        }
      });

      this.socket.on('log-stream', (response) => {
        if (response.status === 'success') {
          const data = response.data;
          if (data.append) {
            this.appendLogs(data.logs);
          } else {
            this.replaceLogs(data.logs);
          }
        }
      });

      this.socket.on('backend-log-entry', (response) => {
        if (response.status === 'success' && response.data) {
          this.handleBackendLog(response.data);
        }
      });

      // Error handling
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    } catch (err) {
      console.error('Failed to initialize socket connection:', err);
    }
  }

  private disconnectSocket(): void {
    if (this.socket) {
      // Remove all listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('log-batch');
      this.socket.off('log-stream');
      this.socket.off('backend-log-entry');
      this.socket.off('error');

      // Disconnect the socket
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private subscribeToServerLogs(filter?: LogFilter): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot subscribe to logs: Socket not connected');
      return;
    }

    // Store the current filter
    this.filter = filter || this.filter;

    this.socket.emit('subscribe-logs', this.filter);
  }

  updateFilter(filter: LogFilter): void {
    this.filter = { ...filter };

    if (this.socket && this.socket.connected) {
      this.socket.emit('update-filter', this.filter);
    }
  }

  getLatestLogs(afterTimestamp?: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot get latest logs: Socket not connected');
      return;
    }

    const options = afterTimestamp ? { afterTimestamp } : {};
    this.socket.emit('get-latest-logs', options);
  }

  /**
   * Fetch logs from server with optional filtering
   * @param filter Optional filter criteria
   * @returns Observable of LogResponse
   */
  fetchLogs(filter?: Partial<LogFilter>): Observable<LogResponse> {
    // Convert filter to query params for HTTP request
    const params: Record<string, string> = {};

    if (filter) {
      // Convert filter to query parameters
      if (filter.level !== undefined) {
        params['level'] = filter.level.toString();
      }
      if (filter.service) {
        params['source'] = filter.service;
      }
      if (filter.limit) {
        params['limit'] = filter.limit.toString();
      }
      if (filter.startDate) {
        params['startDate'] = filter.startDate;
      }
      if (filter.endDate) {
        params['endDate'] = filter.endDate;
      }
      if (filter.search) {
        params['search'] = filter.search;
      }
    }

    // Save filter for potential reuse
    this.filter = filter || {};

    return this.logDispatchService.fetchLogs(params).pipe(
      map((response) => {
        if (response.status && response.logs) {
          this.replaceLogs(response.logs);
        }
        return response;
      }),
      catchError((err) => {
        console.error('Error fetching logs:', err);
        return throwError(() => err);
      })
    );
  }

  // Add a log entry via API
  addLog(
    level: LogLevelEnum,
    message: string,
    source: string = 'client',
    details: Record<string, unknown> = {}
  ): Observable<LogEntry> {
    const entry: LogEntry = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      source,
      timestamp: new Date().toISOString(),
      details,
    };

    // Add to local logs immediately
    this.addLogLocally(entry);

    // Send to server
    this.logDispatchService
      .sendLogs([entry])
      .pipe(
        map((response) => {
          if (!response.success) {
            console.error('Failed to send log to server:', response.message);
          }
          return entry;
        }),
        catchError((error) => {
          console.error('Error sending log to server:', error);
          return throwError(() => error);
        })
      )
      .subscribe(); // Intentional direct subscribe for fire-and-forget

    return new Observable<LogEntry>((observer) => {
      observer.next(entry);
      observer.complete();
    });
  }

  /**
   * Get logs observable
   * @returns Observable of log entries
   */
  getLogs(filter?: LogFilter): Observable<LogEntry[]> {
    // If filter is provided, you would apply filtering logic here
    if (filter) {
      const currentLogs = this.logsSubject.getValue();
      const filteredLogs = this.applyFilter(currentLogs, filter);
      return new Observable<LogEntry[]>((observer) => {
        observer.next(filteredLogs);
        observer.complete();
      });
    }
    // Otherwise simply return the logs$ observable
    return this.logs$;
  }

  // Convenience methods for different log levels
  debug(
    message: string,
    source: string = 'client',
    details: Record<string, unknown> = {}
  ): Observable<LogEntry> {
    return this.addLog(LogLevelEnum.DEBUG, message, source, details);
  }

  info(
    message: string,
    source: string = 'client',
    details: Record<string, unknown> = {}
  ): Observable<LogEntry> {
    return this.addLog(LogLevelEnum.INFO, message, source, details);
  }

  warn(
    message: string,
    source: string = 'client',
    details: Record<string, unknown> = {}
  ): Observable<LogEntry> {
    return this.addLog(LogLevelEnum.WARN, message, source, details);
  }

  error(
    message: string,
    source: string = 'client',
    details: Record<string, unknown> = {}
  ): Observable<LogEntry> {
    return this.addLog(LogLevelEnum.ERROR, message, source, details);
  }

  // Handle logs from backend
  private handleBackendLog(log: LogEntry): void {
    this.addLogLocally(log);
  }

  private addLogLocally(log: LogEntry): void {
    // Add to all logs
    const currentLogs = this.logsSubject.getValue();
    const updatedLogs = [log, ...currentLogs].slice(0, this.MAX_LOG_RECORDS);
    this.logsSubject.next(updatedLogs);

    // Add to filtered logs if it matches the filter
    if (this.matchesFilter(log, this.filter)) {
      const currentFiltered = this.filteredLogsSubject.getValue();
      const updatedFiltered = [log, ...currentFiltered].slice(
        0,
        this.MAX_LOG_RECORDS
      );
      this.filteredLogsSubject.next(updatedFiltered);
    }

    // Emit as a new log
    this.newLogSubject.next(log);
  }

  private processBatchLogs(logs: LogEntry[]): void {
    if (!logs || logs.length === 0) {
      return;
    }

    // Add all logs to the current logs
    const currentLogs = this.logsSubject.getValue();
    const allLogs = [...logs, ...currentLogs].slice(0, this.MAX_LOG_RECORDS);
    this.logsSubject.next(allLogs);

    // Filter logs based on current filter
    const filteredLogs = logs.filter((log) =>
      this.matchesFilter(log, this.filter)
    );
    if (filteredLogs.length > 0) {
      const currentFiltered = this.filteredLogsSubject.getValue();
      const allFiltered = [...filteredLogs, ...currentFiltered].slice(
        0,
        this.MAX_LOG_RECORDS
      );
      this.filteredLogsSubject.next(allFiltered);
    }

    // Emit new logs one by one
    logs.forEach((log) => this.newLogSubject.next(log));
  }

  private appendLogs(logs: LogEntry[]): void {
    if (!logs || logs.length === 0) {
      return;
    }

    // Add the logs to existing logs
    const currentLogs = this.logsSubject.getValue();
    const allLogs = [...currentLogs, ...logs].slice(0, this.MAX_LOG_RECORDS);
    this.logsSubject.next(allLogs);

    // Filter logs for the filtered stream
    const filteredLogs = logs.filter((log) =>
      this.matchesFilter(log, this.filter)
    );
    if (filteredLogs.length > 0) {
      const currentFiltered = this.filteredLogsSubject.getValue();
      const allFiltered = [...currentFiltered, ...filteredLogs].slice(
        0,
        this.MAX_LOG_RECORDS
      );
      this.filteredLogsSubject.next(allFiltered);
    }
  }

  private replaceLogs(logs: LogEntry[]): void {
    // Replace all logs
    this.logsSubject.next(logs.slice(0, this.MAX_LOG_RECORDS));

    // Filter logs for the filtered stream
    const filteredLogs = logs.filter((log) =>
      this.matchesFilter(log, this.filter)
    );
    this.filteredLogsSubject.next(filteredLogs.slice(0, this.MAX_LOG_RECORDS));
  }

  /**
   * Apply filter to logs
   * @param logs The logs to filter
   * @param filterParams The filter parameters
   * @returns The filtered logs
   */
  private applyFilter(logs: LogEntry[], filterParams?: LogFilter): LogEntry[] {
    if (!filterParams) {
      return logs;
    }

    return logs.filter((log) => this.matchesFilter(log, filterParams));
  }

  private matchesFilter(log: LogEntry, filterParams?: LogFilter): boolean {
    if (!filterParams) {
      return true;
    }

    // Check level
    if (filterParams.level !== undefined) {
      if (Array.isArray(filterParams.level)) {
        if (
          filterParams.level.length > 0 &&
          !filterParams.level.includes(log.level)
        ) {
          return false;
        }
      } else if (
        filterParams.level !== null &&
        log.level !== filterParams.level
      ) {
        return false;
      }
    }

    // Check source/service
    if (filterParams.service && log.source !== filterParams.service) {
      return false;
    }

    // Check search term
    if (filterParams.search) {
      const searchLower = filterParams.search.toLowerCase();
      const messageMatch = log.message.toLowerCase().includes(searchLower);
      const sourceMatch =
        log.source && log.source.toLowerCase().includes(searchLower);
      if (!messageMatch && !sourceMatch) {
        return false;
      }
    }

    // Check date range
    if (
      filterParams.startDate &&
      new Date(log.timestamp) < new Date(filterParams.startDate)
    ) {
      return false;
    }

    if (
      filterParams.endDate &&
      new Date(log.timestamp) > new Date(filterParams.endDate)
    ) {
      return false;
    }

    return true;
  }

  private cleanupSubscriptions(): void {
    // Check if this.subscriptions exists and unsubscribe
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  // Helper method to parse socket errors
  private parseSocketError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    } else if (error && typeof error === 'object') {
      if ('message' in error) {
        return (error as { message: string }).message;
      }
      return JSON.stringify(error);
    }
    return 'Unknown error';
  }

  /**
   * Filter logs using the base LogFilter interface
   * This provides compatibility with systems expecting to work with the basic LogFilter
   */
  filterWithBasicFilter(filter: LogFilter): LogEntry[] {
    const currentLogs = this.logsSubject.getValue();
    return this.applyFilter(currentLogs, filter);
  }
}
