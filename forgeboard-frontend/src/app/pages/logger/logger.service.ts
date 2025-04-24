import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of, timer, Subscription } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { LogLevel, LogEntry, LogFilter, LogResponse, LogStreamUpdate, SocketResponse } from '@forge-board/shared/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class LoggerService implements OnDestroy {
  private readonly apiUrl = 'http://localhost:3000/api/logs';
  private readonly socketUrl = 'http://localhost:3000';
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Log data subjects
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  private logStatsSubject = new BehaviorSubject<Record<LogLevel, number>>({
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
    [LogLevel.FATAL]: 0
  });
  
  // Filter subject
  private filterSubject = new BehaviorSubject<LogFilter>({
    levels: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    sources: [],
    startTime: null,
    endTime: null,
    search: ''
  });
  
  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Mock data generation
  private mockDataInterval: any;
  private mockDataSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {
    // Initialize socket connection
    this.initSocket();
    
    // Subscribe to filter changes to refresh logs
    this.filterSubject.subscribe(filter => {
      this.refreshLogs(filter);
    });
  }

  ngOnDestroy(): void {
    // Clean up socket
    this.cleanupSocket();
    
    // Complete subjects
    this.logsSubject.complete();
    this.logStatsSubject.complete();
    this.filterSubject.complete();
    this.connectionStatusSubject.complete();
    
    // Stop mock data generation if active
    this.stopMockDataGeneration();
  }

  /**
   * Initialize socket connection for real-time logs
   */
  private initSocket(): void {
    try {
      console.log('LoggerService: Initializing socket connection');
      
      // Create socket connection
      this.socket = io(`${this.socketUrl}/logs`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      // Set up event handlers
      this.setupSocketEvents();
    } catch (err) {
      console.error('Failed to connect to logger socket:', err);
      this.connectionStatusSubject.next(false);
      
      // Start mock data generation
      this.startMockDataGeneration();
    }
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketEvents(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to logger socket');
      this.connectionStatusSubject.next(true);
      
      // Stop mock data generation if it's active
      this.stopMockDataGeneration();
      
      // Subscribe to log stream
      this.socket?.emit('subscribe-logs', this.filterSubject.getValue());
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from logger socket');
      this.connectionStatusSubject.next(false);
      
      // Start mock data generation
      this.startMockDataGeneration();
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Logger socket connection error:', err);
      this.connectionStatusSubject.next(false);
      
      // Start mock data generation
      this.startMockDataGeneration();
    });
    
    this.socket.on('log-stream', (response: SocketResponse<LogStreamUpdate>) => {
      if (response.status === 'success') {
        // Update logs
        if (response.data.append) {
          // Append new logs to existing logs
          const currentLogs = this.logsSubject.getValue();
          const updatedLogs = response.data.logs ?? (response.data.log ? [response.data.log] : []);
          this.logsSubject.next([...currentLogs, ...updatedLogs]);
        } else {
          // Replace existing logs
          const newLogs = response.data.logs ?? (response.data.log ? [response.data.log] : []);
          this.logsSubject.next(newLogs);
        }
        
        // Update stats
        if (response.data.stats) {
          this.logStatsSubject.next(response.data.stats);
        }
      }
    });
  }
  
  /**
   * Clean up socket connection
   */
  private cleanupSocket(): void {
    if (this.socket) {
      console.log('LoggerService: Cleaning up socket');
      
      // Remove event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('log-stream');
      this.socket.off('connect_error');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
    }
  }
  
  /**
   * Generate mock log data
   */
  private startMockDataGeneration(): void {
    if (this.mockDataInterval) return;
    
    console.log('LoggerService: Starting mock data generation');
    
    // Generate initial mock logs
    const initialLogs: LogEntry[] = [];
    const now = new Date();
    
    const sources = ['app', 'api', 'database', 'auth', 'network'];
    const messages = [
      'User logged in successfully',
      'API request processed',
      'Database query executed',
      'Request validation failed',
      'Network timeout occurred',
      'Cache updated',
      'File upload completed',
      'Authorization failed',
      'Rate limit exceeded',
      'Session expired'
    ];
    const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    
    // Generate some initial logs
    for (let i = 0; i < 20; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      initialLogs.push({
        id: `mock-${i}`,
        timestamp: new Date(now.getTime() - (i * 60000)).toISOString(),
        level,
        source,
        message,
        details: { mock: true }
      });
    }
    
    // Update logs
    this.logsSubject.next(initialLogs);
    
    // Calculate stats
    const stats = initialLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);
    
    // Update stats
    this.logStatsSubject.next({
      [LogLevel.DEBUG]: stats[LogLevel.DEBUG] || 0,
      [LogLevel.INFO]: stats[LogLevel.INFO] || 0,
      [LogLevel.WARN]: stats[LogLevel.WARN] || 0,
      [LogLevel.ERROR]: stats[LogLevel.ERROR] || 0,
      [LogLevel.FATAL]: stats[LogLevel.FATAL] || 0
    });
    
    // Set up interval to add new logs occasionally
    this.mockDataSubscription = timer(5000, 8000).subscribe(() => {
      const logs = this.logsSubject.getValue();
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      const newLog: LogEntry = {
        id: `mock-${logs.length}`,
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
        details: { mock: true }
      };
      
      // Add new log
      this.logsSubject.next([newLog, ...logs]);
      
      // Update stats
      const currentStats = this.logStatsSubject.getValue();
      currentStats[level] = (currentStats[level] || 0) + 1;
      this.logStatsSubject.next({...currentStats});
    });
  }
  
  /**
   * Stop mock data generation
   */
  private stopMockDataGeneration(): void {
    if (this.mockDataSubscription) {
      console.log('LoggerService: Stopping mock data generation');
      this.mockDataSubscription.unsubscribe();
      this.mockDataSubscription = null;
    }
  }
  
  /**
   * Refresh logs based on filter
   */
  private refreshLogs(filter: LogFilter): void {
    if (this.socket?.connected) {
      // If connected to socket, update subscription
      this.socket.emit('update-filter', filter);
    } else {
      // Otherwise, filter local logs
      this.http.get<LogResponse>(`${this.apiUrl}`, { params: this.buildFilterParams(filter) })
        .pipe(
          catchError(() => {
            // If HTTP request fails, filter mock logs
            const allLogs = this.logsSubject.getValue();
            const filteredLogs = this.applyFilter(allLogs, filter);
            return of({
              logs: filteredLogs,
              total: filteredLogs.length,
              success: true
            });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.logsSubject.next(response.logs);
          }
        });
    }
  }
  
  /**
   * Apply filter to logs
   */
  private applyFilter(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter(log => {
      // Filter by level
      if (filter.levels && filter.levels.length > 0 && !filter.levels.includes(log.level)) {
        return false;
      }
      
      // Filter by source
      if (filter.sources && filter.sources.length > 0 && !filter.sources.includes(log.source)) {
        return false;
      }
      
      // Filter by start time
      if (filter.startTime && new Date(log.timestamp) < new Date(filter.startTime)) {
        return false;
      }
      
      // Filter by end time
      if (filter.endTime && new Date(log.timestamp) > new Date(filter.endTime)) {
        return false;
      }
      
      // Filter by search
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Build query parameters for filter
   */
  private buildFilterParams(filter: LogFilter): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (filter.levels?.length) {
      params['levels'] = filter.levels.join(',');
    }
    
    if (filter.sources?.length) {
      params['sources'] = filter.sources.join(',');
    }
    
    if (filter.startTime) {
      params['startTime'] = filter.startTime;
    }
    
    if (filter.endTime) {
      params['endTime'] = filter.endTime;
    }
    
    if (filter.search) {
      params['search'] = filter.search;
    }
    
    return params;
  }
  
  /**
   * Get logs observable
   */
  getLogs(): Observable<LogEntry[]> {
    return this.logsSubject.asObservable();
  }
  
  /**
   * Get log stats observable
   */
  getLogStats(): Observable<Record<LogLevel, number>> {
    return this.logStatsSubject.asObservable();
  }
  
  /**
   * Get connection status observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  /**
   * Update log filter
   */
  updateFilter(filter: Partial<LogFilter>): void {
    const currentFilter = this.filterSubject.getValue();
    this.filterSubject.next({
      ...currentFilter,
      ...filter
    });
  }
  
  /**
   * Get current filter
   */
  getCurrentFilter(): LogFilter {
    return this.filterSubject.getValue();
  }
  
  /**
   * Export logs to JSON file
   */
  exportLogsToJson(): void {
    const logs = this.logsSubject.getValue();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `forge-board-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  }
  
  /**
   * Export logs to CSV file
   */
  exportLogsToCsv(): void {
    const logs = this.logsSubject.getValue();
    
    // CSV header
    const csvHeader = 'Timestamp,Level,Source,Message\n';
    
    // CSV rows
    const csvRows = logs.map(log => {
      const timestamp = log.timestamp;
      const level = log.level;
      const source = log.source;
      const message = `"${log.message.replace(/"/g, '""')}"`;
      
      return `${timestamp},${level},${source},${message}`;
    }).join('\n');
    
    const csvString = `${csvHeader}${csvRows}`;
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`;
    
    const exportFileName = `forge-board-logs-${new Date().toISOString()}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  }
}
