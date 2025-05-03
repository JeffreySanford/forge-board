import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer, Subject } from 'rxjs';
import { LogLevel, LogSocketResponse } from './log-types';
import { LogDispatchService } from '../../services/log-dispatch.service';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { LogLevelEnum, logLevelEnumToString } from '@forge-board/shared/api-interfaces';

// Define the LogEntry interface locally since it's missing from shared
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevelEnum;  // Changed from LogLevelType to LogLevelEnum
  message: string;
  source?: string;
  service?: string;
  data?: Record<string, unknown>;
  // Extended display properties
  displayMessage?: string;
  rawData?: string;
  expanded?: boolean;
  categories?: string[];
  eventId?: string;
  
  // Duplicate tracking
  duplicateCount?: number;
  duplicates?: LogEntry[];
  
  // Category grouping
  isCategory?: boolean;
  categoryName?: string;
  categoryLogs?: LogEntry[];
  categoryCount?: number;
  
  // Additional metadata for display
  details?: Record<string, unknown>;
}

// Define query response interface
export interface LogQueryResponse {
  status: boolean;
  logs: LogEntry[];
  totalCount: number;
  filtered?: boolean;
  timestamp?: string;
}

// Define filter interface
export interface LogFilter {
  level?: LogLevelEnum | LogLevelEnum[];
  loglevels?: LogLevelEnum[]; // Updated to use enum
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

// Define types that aren't in the shared interfaces
export interface LogStreamUpdate {
  log?: LogEntry;
  logs?: LogEntry[];
  totalCount: number;
  append?: boolean;
  stats?: Record<string, number>;
}

// Define response interface for log fetch operations by extending LogQueryResponse
export interface LogFetchResponse extends LogQueryResponse {
  success?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService implements OnDestroy {
  // Use environment variables for URLs
  private readonly apiUrl = `${environment.apiBaseUrl}/logs`;
  private readonly socketUrl = environment.socketBaseUrl;
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Log data subjects
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  private logStatsSubject = new BehaviorSubject<Record<LogLevel, number>>({
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
    [LogLevel.FATAL]: 0,
    [LogLevel.TRACE]: 0  // Added missing TRACE level
  });
  
  // Filter subject
  private filterSubject = new BehaviorSubject<LogFilter>({
    level: LogLevelEnum.DEBUG,
    loglevels: [LogLevelEnum.DEBUG, LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR, LogLevelEnum.FATAL],
    service: '', 
    startDate: undefined,
    endDate: undefined,
    search: ''
  });
  
  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Mock data generation
  private mockDataInterval: ReturnType<typeof setInterval> | null = null; // Fixed: using proper type instead of any
  private mockDataSubscription: Subscription | null = null;

  constructor(private logDispatch: LogDispatchService) {
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
    
    this.socket.on('log-stream', (response: LogSocketResponse<LogStreamUpdate>) => {
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
        
        // Update stats if they exist in the response
        const extendedData = response.data as LogStreamUpdate & { stats?: Record<LogLevel, number> };
        if (extendedData.stats) {
          this.logStatsSubject.next(extendedData.stats);
        }
      }
    });

    // Updated event name from "new-log" to "backend-log-entry"
    this.socket.on('backend-log-entry', (response: LogSocketResponse<LogEntry>) => {
      if (response.status === 'success') {
        const logEntry = response.data;
        // Process and beautify the log entry for human readability
        const processedEntry = this.processLogEntryForDisplay(logEntry);
        // Add to logs (at the beginning for newest-first)
        const currentLogs = this.logsSubject.getValue();
        this.logsSubject.next([processedEntry, ...currentLogs]);
        
        // Update stats
        const currentStats = this.logStatsSubject.getValue();
        const mappedLevel = this.mapApiLevelToLocalEnum(processedEntry.level);
        currentStats[mappedLevel] = (currentStats[mappedLevel] || 0) + 1;
        this.logStatsSubject.next({...currentStats});
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
    const levels: LogLevelEnum[] = [
      LogLevelEnum.DEBUG,
      LogLevelEnum.INFO,
      LogLevelEnum.WARN,
      LogLevelEnum.ERROR,
      LogLevelEnum.FATAL
    ];
    
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
      // Map API log level to our local LogLevel enum to ensure type compatibility
      const mappedLevel = this.mapApiLevelToLocalEnum(log.level);
      acc[mappedLevel] = (acc[mappedLevel] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);
    
    // Update stats
    this.logStatsSubject.next({
      [LogLevel.DEBUG]: stats[LogLevel.DEBUG] || 0,
      [LogLevel.INFO]: stats[LogLevel.INFO] || 0,
      [LogLevel.WARN]: stats[LogLevel.WARN] || 0,
      [LogLevel.ERROR]: stats[LogLevel.ERROR] || 0,
      [LogLevel.FATAL]: stats[LogLevel.FATAL] || 0,
      [LogLevel.TRACE]: stats[LogLevel.TRACE] || 0  // Added missing TRACE level
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
      const mappedLevel = this.mapApiLevelToLocalEnum(level);
      currentStats[mappedLevel] = (currentStats[mappedLevel] || 0) + 1;
      this.logStatsSubject.next({...currentStats});
    });
  }
  
  /**
   * Map API log level (LogLevelEnum) to our local LogLevel enum
   * This resolves the type incompatibility between the shared LogLevelEnum and our local enum
   */
  private mapApiLevelToLocalEnum(level: LogLevelEnum): LogLevel {
    switch(level) {
      case LogLevelEnum.DEBUG: return LogLevel.DEBUG;
      case LogLevelEnum.INFO: return LogLevel.INFO;
      case LogLevelEnum.WARN: return LogLevel.WARN;
      case LogLevelEnum.ERROR: return LogLevel.ERROR;
      case LogLevelEnum.FATAL: return LogLevel.FATAL;
      case LogLevelEnum.TRACE: return LogLevel.TRACE;
      default: return LogLevel.INFO; // Default fallback
    }
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
      // Otherwise, filter local logs using our dispatcher
      this.logDispatch.fetchLogs(this.buildFilterParams(filter))
        .subscribe(response => {
          if (response.status) { // Check for status instead of success
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
      // Filter by level (use level instead of levels)
      if (filter.level) {
        if (Array.isArray(filter.level)) {
          if (!filter.level.includes(log.level)) {
            return false;
          }
        } else if (filter.level !== log.level) {
          return false;
        }
      }
      
      // Filter by service (use service instead of sources)
      if (filter.service && filter.service !== log.source) {
        return false;
      }
      
      // Filter by startDate (use startDate instead of startTime)
      if (filter.startDate && new Date(log.timestamp) < new Date(filter.startDate)) {
        return false;
      }
      
      // Filter by endDate (use endDate instead of endTime)
      if (filter.endDate && new Date(log.timestamp) > new Date(filter.endDate)) {
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
   * Connect to the socket server
   */
  private connectToSocket(): void {
    if (this.socket) {
      this.cleanupSocket(); // Make sure we clean up any existing connections
    }
  
    try {
      console.log('Connecting to socket server:', `${this.socketUrl}/logs`);
      this.socket = io(`${this.socketUrl}/logs`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        forceNew: true
      });
  
      this.socket.on('connect', () => {
        console.log('Socket connected to logs namespace');
        this.connectionStatusSubject.next(true);
        this.stopMockDataGeneration();
        
        // Request initial data - use the current filter
        const filter = this.filterSubject.getValue();
        if (this.socket) { // Fixed: Added null check for this.socket
          this.socket.emit('filter-logs', filter);
        }
      });
  
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected from logs namespace:', reason);
        this.connectionStatusSubject.next(false);
        this.startMockDataGeneration(); // Only start mock data if disconnected
      });
  
      this.setupSocketEvents();
    } catch (error) {
      console.error('Error connecting to socket:', error);
      this.connectionStatusSubject.next(false);
      this.startMockDataGeneration();
    }
  }
  
  /**
   * Build query parameters for filter
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
    
    // Use service instead of sources
    if (filter.service) {
      params['service'] = filter.service;
    }
    
    // Use startDate and endDate
    if (filter.startDate) {
      params['startDate'] = filter.startDate;
    }
    
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

  /**
   * Process a log entry for human-readable display
   * Converts complex JSON data into a more readable format
   */
  private processLogEntryForDisplay(logEntry: LogEntry): LogEntry {
    if (!logEntry) return logEntry;
    
    // Create a copy of the log entry to avoid modifying the original
    const processedEntry = { ...logEntry };
    
    // Process complex data objects into a more human-readable format
    if (processedEntry.data && typeof processedEntry.data === 'object') {
      // Extract key information based on known patterns
      const data = processedEntry.data as Record<string, unknown>;
      
      // Create a humanized message from the data
      let humanizedMessage = processedEntry.message;
      
      // Handle type validation logs (like in your example)
      if (data['typeName'] && data['valid'] !== undefined) {
        const validityStatus = data['valid'] ? 'Valid' : 'Invalid';
        const context = data['callerInfo'] ? ` (from ${data['callerInfo']})` : '';
        humanizedMessage = `${validityStatus} ${data['typeName']}${context}`;
      }
      
      // Handle service/action pattern
      if (data['service'] && data['action']) {
        humanizedMessage = `${data['service']}.${data['action']}`;
        
        // Add additional context if available
        if (data['typeName']) {
          humanizedMessage += ` for ${data['typeName']}`;
        }
        
        // Add status information when available
        if (data['valid'] !== undefined) {
          humanizedMessage += ` - ${data['valid'] ? 'Success' : 'Failed'}`;
        } else if (data['status']) {
          humanizedMessage += ` - ${data['status']}`;
        }
      }
      
      // Add important properties to the message
      if (data['userId']) {
        humanizedMessage += ` [User: ${data['userId']}]`;
      }
      
      if (data['eventId']) {
        processedEntry.eventId = data['eventId'] as string;
      }
      
      // Generate categories based on the log entry
      const categories: string[] = [];
      
      // Add source as a category
      if (processedEntry.source) {
        categories.push(processedEntry.source);
      }
      
      // Add specific categories based on data properties
      if (data['typeName']) {
        categories.push(`type:${data['typeName']}`);
      }
      
      if (data['action']) {
        categories.push(`action:${data['action']}`);
      }
      
      if (data['service']) {
        categories.push(`service:${data['service']}`);
      }
      
      // Add error category if appropriate
      if ((processedEntry.level === LogLevelEnum.ERROR || processedEntry.level === LogLevelEnum.FATAL) ||
          data['error'] || data['valid'] === false) {
        categories.push('errors');
      }
      
      // Store the processed data
      processedEntry.message = humanizedMessage;
      processedEntry.displayMessage = humanizedMessage;
      processedEntry.rawData = JSON.stringify(data, null, 2);
      processedEntry.categories = categories;
      processedEntry.expanded = false; // Initially collapsed
    }
    
    return processedEntry;
  }
  
  /**
   * Group logs by category or detect duplicates
   * @param logs List of logs to process
   * @param groupByCategory Whether to group by category instead of detecting duplicates
   * @returns Grouped logs
   */
  groupLogs(logs: LogEntry[], groupByCategory: boolean = false): LogEntry[] {
    if (!groupByCategory) {
      // Group duplicate logs (based on content)
      return this.groupDuplicateLogs(logs);
    } else {
      // Group logs by category
      return this.groupLogsByCategory(logs);
    }
  }
  
  /**
   * Group logs that have identical content, showing only one with a count
   */
  private groupDuplicateLogs(logs: LogEntry[]): LogEntry[] {
    if (!logs || logs.length === 0) return [];
    
    // Group logs by a signature composed of level, source, and message
    const groups = new Map<string, LogEntry[]>();
    
    for (const log of logs) {
      // Create a signature for this log
      const signature = `${log.level}|${log.source}|${log.message}`;
      
      if (!groups.has(signature)) {
        groups.set(signature, []);
      }
      
      // Get the group safely - we know it exists because we just created it if missing
      const group = groups.get(signature);
      if (group) {
        group.push(log);
      }
    }
    
    // Convert groups back to an array of logs with duplicate count
    return Array.from(groups.entries()).map(([signature, groupLogs]) => {
      
      
      
      const baseLog = { ...groupLogs[0] };
      
      // If there are duplicates, add count information
      if (groupLogs.length > 1) {
        baseLog.duplicates = groupLogs.slice(1);
        baseLog.duplicateCount = groupLogs.length;
      }
      
      baseLog.id = `group-${signature}-${Date.now()}`; // Unique ID for the group
      baseLog.timestamp = new Date().toISOString(); // Update timestamp to now
      baseLog.level = LogLevelEnum.INFO; // Set to INFO for grouped logs
      baseLog.source = 'logger'; // Set source to logger for grouped logs
      baseLog.message = `Grouped log entry: ${signature}`; // Set a generic message for the group
      baseLog.isCategory = true; // Mark as a category group
      baseLog.categoryName = 'Grouped Logs'; // Set a category name for the group
      baseLog.categoryLogs = groupLogs; // Store the original logs in the group
      baseLog.categoryCount = groupLogs.length; // Count of logs in this group
      baseLog.categories = groupLogs[0].categories; // Use the categories from the first log
      this.processLogEntryForDisplay(baseLog); // Process for display
      
      return baseLog;
    });
  }
  
  /**
   * Group logs by their categories
   */
  private groupLogsByCategory(logs: LogEntry[]): LogEntry[] {
    if (!logs || logs.length === 0) return [];
    
    // First, ensure all logs have processed categories
    const processedLogs = logs.map(log => {
      if (!log.categories) {
        const processed = this.processLogEntryForDisplay(log);
        return processed;
      }
      return log;
    });
    
    // Find all unique categories
    const allCategories = new Set<string>();
    processedLogs.forEach(log => {
      (log.categories || []).forEach(category => allCategories.add(category));
    });
    
    // For each category, create a virtual group log entry
    const groupedLogs: LogEntry[] = [];
    
    allCategories.forEach(category => {
      // Find all logs in this category
      const logsInCategory = processedLogs.filter(log => 
        log.categories && log.categories.includes(category)
      );
      
      if (logsInCategory.length > 1) {
        // Create a category group entry
        const groupLog: LogEntry = {
          id: `category-${category}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: LogLevelEnum.INFO,
          source: 'logger',
          message: `Category: ${category}`,
          isCategory: true,
          categoryName: category,
          categoryLogs: logsInCategory,
          categoryCount: logsInCategory.length
        };
        
        groupedLogs.push(groupLog);
      } else if (logsInCategory.length === 1) {
        // Just add the single log
        if (!groupedLogs.find(l => l.id === logsInCategory[0].id)) {
          groupedLogs.push(logsInCategory[0]);
        }
      }
    });
    
    return groupedLogs;
  }
  
  /**
   * Toggle the expanded state of a log entry
   */
  toggleLogExpansion(log: LogEntry): void {
    log.expanded = !log.expanded;
    // Update the log in the subject
    const logs = this.logsSubject.getValue();
    this.logsSubject.next([...logs]);
  }

  /**
   * Get latest logs from the source
   * Returns an observable of the latest logs
   */
  getLatestLogs(): Observable<LogEntry[]> {
    // If connected to socket, request latest logs
    if (this.socket?.connected) {
      this.socket.emit('get-latest-logs');
      // The response will come through the log-stream event
      // which already updates the logsSubject
    } else {
      // If not connected, use the dispatcher to fetch logs
      this.logDispatch.fetchLogs(this.buildFilterParams(this.filterSubject.getValue()))
        .subscribe(response => {
          if (response.status) {
            this.logsSubject.next(response.logs);
          }
        });
    }
    
    // Return the current value of logsSubject
    return this.logsSubject.asObservable();
  }
  
  /**
   * New log entry observable for real-time updates
   */
  get newLogEntry$(): Observable<LogEntry> {
    // Create a new subject for new log entries
    const newLogEntrySubject = new Subject<LogEntry>();
    
    // Listen for socket events to forward new log entries
    if (this.socket) {
      this.socket.on('backend-log-entry', (response: LogSocketResponse<LogEntry>) => {
        if (response.status === 'success') {
          const processedEntry = this.processLogEntryForDisplay(response.data);
          newLogEntrySubject.next(processedEntry);
        }
      });
    }
    
    // For mock data generation, we'll simulate new log entries
    this.mockDataSubscription?.add(timer(3000, 10000).subscribe(() => {
      if (!this.socket?.connected) {
        const mockEntry = this.generateMockLogEntry();
        newLogEntrySubject.next(mockEntry);
      }
    }));
    
    return newLogEntrySubject.asObservable();
  }
  
  /**
   * Generate a mock log entry for testing
   */
  private generateMockLogEntry(): LogEntry {
    const sources = ['AppModule', 'TypeDiagnosticsService', 'ConfigService', 'ExampleService', 'SystemLoader'];
    const levels = [LogLevelEnum.DEBUG, LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR];
    const actions = ['initialize', 'registerValidator', 'update', 'query', 'validate'];
    
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    let message = '';
    let data: Record<string, unknown> = {};
    
    // Define all possible variables outside of switch cases to avoid ESLint warnings
    const typeNames = ['MetricData', 'LogResponse', 'UserProfile', 'ConnectionSettings'];
    const typeName = typeNames[Math.floor(Math.random() * typeNames.length)];
    
    switch (source) {
      case 'TypeDiagnosticsService':
        message = `${action === 'registerValidator' ? 'Registered validator for type: ' : 'Validating type: '}${typeName}`;
        data = {
          service: 'TypeDiagnosticsService',
          action: action,
          typeName: typeName,
          validatorsCount: Math.floor(Math.random() * 10) + 1
        };
        break;
        
      case 'ConfigService':
        message = 'Running in development mode';
        data = {
          service: 'ConfigService',
          action: 'checkEnvironment',
          environment: 'development',
          features: {
            realtime: true,
            analytics: false
          }
        };
        break;
        
      default:
        message = `${source} ${action}ed successfully`;
        data = {
          service: source,
          action: action,
          timestamp: new Date().toISOString()
        };
        break;
    }
    
    return {
      id: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data
    };
  }
}
