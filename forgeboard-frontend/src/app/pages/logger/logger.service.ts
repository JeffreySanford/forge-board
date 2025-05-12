import { Injectable, OnDestroy } from '@angular/core'; // Removed NgZone
import { BehaviorSubject, Observable, Subject, Subscription, map, of, timer } from 'rxjs'; // Removed filter, firstValueFrom, takeUntil, tap
import { catchError } from 'rxjs/operators'; // Added catchError
import { LogEntry, LogLevelEnum, LogFilter, SocketResponse, LogQueryResponse, LogStatsResult, LogStreamUpdate, stringToLogLevelEnum, logLevelEnumToString, LogLevelString } from '@forge-board/shared/api-interfaces'; // Added LogStreamUpdate, stringToLogLevelEnum, logLevelEnumToString
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LogDispatchService } from '../../services/log-dispatch.service'; // Added import
import { SocketRegistryService } from '../../services/socket-registry.service'; // Added import
import { RefreshIntervalService } from '../../services/refresh-interval.service'; // Added import

// Define response interface for log fetch operations by extending LogQueryResponse
export interface LogFetchResponse extends LogQueryResponse {
  total: number;
}

// Assuming DisplayLogEntry is a defined type, possibly similar to LogEntry but for UI
export interface DisplayLogEntry extends LogEntry {
  // ... any additional UI-specific properties ...
  isSelected?: boolean;
  matchesFilter?: boolean;
  displayTimestamp?: string; // Example: for formatted time
  // Removed 'data' if it was here, use 'details' from LogEntry
}

// Define a more specific type for the payload of 'log-stream' events
interface LogStreamPayload {
  logs?: DisplayLogEntry[]; // Assuming logs from stream are also DisplayLogEntry or mapped to it
  log?: DisplayLogEntry;
  append: boolean;
  totalCount?: number;
}


@Injectable({
  providedIn: 'root'
})
export class LoggerService implements OnDestroy {
  // Add API base URL property
  private readonly apiBaseUrl = `${environment.apiBaseUrl}`;
  
  // Use environment variables for URLs
  private readonly socketUrl = environment.socketBaseUrl;
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Log data subjects
  private logStatsSubject = new BehaviorSubject<Record<LogLevelEnum, number>>({
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 0,
    [LogLevelEnum.WARN]: 0,
    [LogLevelEnum.ERROR]: 0,
    [LogLevelEnum.FATAL]: 0,
    [LogLevelEnum.TRACE]: 0
  });
  
  // Filter subject
  private filterSubject = new BehaviorSubject<LogFilter>({
    level: LogLevelEnum.DEBUG,
    service: '', 
    limit: 100
  });
  
  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Auto refresh flag
  private autoRefresh = true;
  
  // Subscriptions
  private subscriptions = new Subscription();
  private mockDataSubscription: Subscription | null = null;
  someBooleanProperty: boolean = false; // This tests for boolean property on an undeclared object

  private _logsSubject = new BehaviorSubject<DisplayLogEntry[]>([]);
  public logs$ = this._logsSubject.asObservable();

  private _filteredLogsSubject = new BehaviorSubject<DisplayLogEntry[]>([]);
  public filteredLogs$ = this._filteredLogsSubject.asObservable();
  
  private mockDataIntervalId: ReturnType<typeof setInterval> | undefined;

  constructor(
    private logDispatch: LogDispatchService,
    private socketRegistry: SocketRegistryService,
    private refreshIntervalService: RefreshIntervalService,
    private http: HttpClient // Add HttpClient injection
  ) {
    // Initialize socket connection
    this.initSocket();
    
    // Subscribe to filter changes to refresh logs
    this.filterSubject.subscribe(filter => {
      this.refreshLogs(filter);
    });

    // Subscribe to refresh interval and fetch logs on each trigger
    this.subscriptions.add(
      this.refreshIntervalService.getRefreshTrigger().subscribe(() => {
        if (this.autoRefresh) {
          this.getLatestLogs().subscribe();
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up socket
    this.cleanupSocket();
    
    // Complete subjects
    this._logsSubject.complete(); // Corrected to _logsSubject
    this.logStatsSubject.complete();
    this.filterSubject.complete();
    this.connectionStatusSubject.complete();
    
    // Stop mock data generation if active
    this.stopMockDataGeneration(); // Added call

    this.subscriptions.unsubscribe();
  }

  /**
   * Ensure the socket is connected
   */
  ensureConnection(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('LoggerService: Ensuring connection');
      this.cleanupSocket(); // Clean up any existing connection
      this.initSocket();    // Initialize new socket connection
    } else {
      console.log('LoggerService: Socket already connected');
    }
  }

  /**
   * Initialize socket connection for real-time logs
   */
  private initSocket(): void {
    try {
      console.log('[LoggerService] Initializing socket connection to:', `${this.socketUrl}/logs`);
      
      // Create socket connection with connection retry
      this.socket = io(`${this.socketUrl}/logs`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      console.log('[LoggerService] Socket object created:', this.socket?.id || 'no ID yet');
      
      // Register socket with the registry service
      if (this.socket) {
        this.socketRegistry.registerSocket('logs', this.socket);
        console.log('[LoggerService] Socket registered with registry');
      }
      
      // Set up event handlers
      this.setupSocketEvents();
      
      // Subscribe to logs now (don't wait for connection)
      this.socket.emit('subscribe-logs');
      console.log('[LoggerService] Sent subscribe-logs event');
      
    } catch (err) {
      console.error('[LoggerService] Failed to connect to logger socket:', err);
      this.connectionStatusSubject.next(false);
      
      // Start mock data generation only if not connected
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
      this.stopMockDataGeneration(); // Added call
      
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
    
    this.socket.on('log-stream', (response: SocketResponse<LogStreamPayload>) => {
      if (response.status === 'success' && response.data) {
        // Update logs
        if (response.data.append) {
          // Append new logs to existing logs
          const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
          const updatedLogs = response.data.logs ?? (response.data.log ? [response.data.log] : []);
          this._logsSubject.next([...currentLogs, ...updatedLogs]); // Corrected to _logsSubject
        } else {
          // Replace existing logs
          const newLogs = response.data.logs ?? (response.data.log ? [response.data.log] : []);
          this._logsSubject.next(newLogs); // Corrected to _logsSubject
        }
        
        // Update stats if they exist in the response
        // The stats keys might be strings; ensure they are mapped to LogLevelEnum if necessary
        const extendedData = response.data as LogStreamUpdate & { stats?: Record<string, number> }; // LogStreamUpdate is now imported
        if (extendedData.stats) {
          const newStats = { ...this.logStatsSubject.getValue() };
          for (const levelKey in extendedData.stats) {
            const numericLevelKey = parseInt(levelKey, 10); // If keys are numeric strings "0", "1"
            if (!isNaN(numericLevelKey) && LogLevelEnum[numericLevelKey] !== undefined) {
               newStats[numericLevelKey as LogLevelEnum] = extendedData.stats[levelKey];
            } else {
               // If keys are string names "DEBUG", "INFO"
               const enumKey = stringToLogLevelEnum(levelKey as LogLevelString); // stringToLogLevelEnum is now imported
               newStats[enumKey] = extendedData.stats[levelKey];
            }
          }
          this.logStatsSubject.next(newStats);
        }
      }
    });

    // Updated event handler for backend-log-entry with loop prevention
    this.socket.on('backend-log-entry', (response: SocketResponse<LogEntry>) => { // Changed LogSocketResponse to SocketResponse
      if (response.status === 'success') {
        const logEntry = response.data;
        
        // LOOP PREVENTION: Check if this log is about log processing itself
        if (this.isLogProcessingLog(logEntry)) {
          // Mark these logs with a special flag and style them with red background
          logEntry.isLoggingLoop = true;
          console.warn('Potential logging loop detected:', logEntry);
        }
        
        // Process and beautify the log entry for human readability
        const processedEntry = this.processLogEntryForDisplay(logEntry);
        
        // Add to logs (at the beginning for newest-first)
        const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
        this._logsSubject.next([processedEntry, ...currentLogs]); // Corrected to _logsSubject
        
        // Update stats using a separate function that doesn't create new logs
        this.updateStatsWithoutLogging(processedEntry);
      }
    });
  }

  /**
   * Check if a log entry is about log processing itself
   */
  private isLogProcessingLog(log: LogEntry): boolean {
    // Detect logs about logging to prevent loops
    const loggingKeywords = [
      'received log', 'processing log', 'log stream', 
      'log filter', 'log updated', 'logger service'
    ];
    
    // Check if message contains logging keywords
    const messageHasLoggingKeywords = loggingKeywords.some(keyword => 
      log.message?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if source is related to logging
    const isLoggerSource = log.source?.toLowerCase().includes('log') || 
                          log.source?.toLowerCase().includes('socket');
    
    return (messageHasLoggingKeywords ?? false) && (isLoggerSource ?? false);
  }

  /**
   * Update stats without generating new logs
   */
  private updateStatsWithoutLogging(logEntry: LogEntry): void {
    try {
      const currentStats = this.logStatsSubject.getValue();
      // logEntry.level is already LogLevelEnum
      currentStats[logEntry.level] = (currentStats[logEntry.level] || 0) + 1;
      this.logStatsSubject.next({...currentStats});
    } catch (error) {
      // Silent catch - don't generate more logs about logging errors
    }
  }

  /**
   * Filter logs by a basic filter and update the logs subject
   * @param basicFilter The basic filter to apply
   * @returns The filtered logs
   */
  filterLogsByBasicFilter(basicFilter: LogFilter): LogEntry[] {
    const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
    const filteredLogs = this.applyFilter(currentLogs, basicFilter);
    
    // Update the logs subject with the filtered results
    this._logsSubject.next(filteredLogs); // Corrected to _logsSubject
    
    return filteredLogs;
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
    if (this.mockDataSubscription) return;
    
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
    const levels: LogLevelEnum[] = [ // Use LogLevelEnum
      LogLevelEnum.DEBUG,
      LogLevelEnum.INFO,
      LogLevelEnum.WARN,
      LogLevelEnum.ERROR,
      LogLevelEnum.FATAL,
      LogLevelEnum.TRACE // Added TRACE
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
    this._logsSubject.next(initialLogs); // Corrected to _logsSubject
    
    // Calculate stats
    const stats = initialLogs.reduce((acc, log) => {
      // log.level is already LogLevelEnum
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevelEnum, number>); // Use LogLevelEnum as key
    
    // Update stats
    this.logStatsSubject.next({
      [LogLevelEnum.DEBUG]: stats[LogLevelEnum.DEBUG] || 0,
      [LogLevelEnum.INFO]: stats[LogLevelEnum.INFO] || 0,
      [LogLevelEnum.WARN]: stats[LogLevelEnum.WARN] || 0,
      [LogLevelEnum.ERROR]: stats[LogLevelEnum.ERROR] || 0,
      [LogLevelEnum.FATAL]: stats[LogLevelEnum.FATAL] || 0,
      [LogLevelEnum.TRACE]: stats[LogLevelEnum.TRACE] || 0
    });
    
    // Set up interval to add new logs occasionally
    this.mockDataSubscription = timer(5000, 8000).subscribe(() => {
      const logs = this._logsSubject.getValue();
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
      this._logsSubject.next([newLog, ...logs]); // Corrected to _logsSubject
      
      // Update stats
      const currentStats = this.logStatsSubject.getValue();
      // newLog.level is already LogLevelEnum
      currentStats[newLog.level] = (currentStats[newLog.level] || 0) + 1;
      this.logStatsSubject.next({...currentStats});
    });
  }
  
  /**
   * Stop mock data generation
   */
  private stopMockDataGeneration(): void {
    if (this.mockDataSubscription) {
      this.mockDataSubscription.unsubscribe();
      this.mockDataSubscription = null;
      console.log('LoggerService: Stopped mock data generation subscription.');
    }
    if (this.mockDataIntervalId) {
      clearInterval(this.mockDataIntervalId);
      this.mockDataIntervalId = undefined;
      console.log('LoggerService: Cleared mock data interval.');
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
            this._logsSubject.next(response.logs); // Corrected to _logsSubject
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
          this.socket.emit('filter-logs', filter); // This should probably be 'subscribe-logs' or 'update-filter'
        }
      });
  
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected from logs namespace:', reason);
        this.connectionStatusSubject.next(false);
        this.startMockDataGeneration(); // Only start mock data if disconnected
      });
  
      this.setupSocketEvents(); // This was already called in initSocket, ensure it's not causing issues.
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
    
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        params['level'] = filter.level.map(l => logLevelEnumToString(l)).join(','); // logLevelEnumToString is now imported
      } else {
        params['level'] = logLevelEnumToString(filter.level); // logLevelEnumToString is now imported
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

    // Safely handle afterTimestamp property
    if (filter.afterTimestamp) {
      params['afterTimestamp'] = filter.afterTimestamp;
    }
    
    return params;
  }
  
  /**
   * Get logs observable
   */
  getLogs(): Observable<LogEntry[]> {
    return this._logsSubject.asObservable(); // Corrected to _logsSubject
  }
  
  /**
   * Get log stats observable
   */
  getLogStats(): Observable<Record<LogLevelEnum, number>> { // Return type uses LogLevelEnum
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
    const logs = this._logsSubject.getValue(); // Corrected to _logsSubject
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
    const logs = this._logsSubject.getValue(); // Corrected to _logsSubject
    
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
    type DisplayLogEntryExtended = DisplayLogEntry & { // Renamed to avoid conflict with outer DisplayLogEntry
      eventId?: string;
      displayMessage?: string;
      // rawData?: string; // rawData is already on LogEntry
      // categories?: string[]; // categories is already on LogEntry
      // expanded?: boolean; // expanded is already on LogEntry
    };

    if (!logEntry) {
      return logEntry;
    }

    const processedEntry: DisplayLogEntryExtended = { ...logEntry } as DisplayLogEntryExtended;

    if (processedEntry.details && typeof processedEntry.details === 'object') { // Changed data to details
      const details = processedEntry.details as Record<string, unknown>;

      if ('eventId' in details) {
        processedEntry.eventId = details['eventId'] as string;
      }

      processedEntry.displayMessage = processedEntry.message;
      // processedEntry.rawData = JSON.stringify(details, null, 2); // rawData is for original, not processed details
      // processedEntry.categories = []; // categories should come from original log or be processed differently
      // processedEntry.expanded = false; // expanded should be managed by UI state
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
    const logs = this._logsSubject.getValue(); // Corrected to _logsSubject
    this._logsSubject.next([...logs]); // Corrected to _logsSubject
  }

  /**
   * Get latest logs from the source
   * Only fetch logs newer than the most recent one we have
   */
  getLatestLogs(): Observable<LogEntry[]> {
    // If connected to socket, request latest logs
    if (this.socket?.connected) {
      const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
      let lastTimestamp: string | undefined;
      
      if (currentLogs.length > 0) {
        // Find the most recent timestamp in our logs
        lastTimestamp = currentLogs[0].timestamp;
      }
      
      // Only request logs newer than our most recent one
      this.socket.emit('get-latest-logs', { afterTimestamp: lastTimestamp });
      // The response will come through the log-stream event
      // which already updates the logsSubject
    } else {
      // If not connected, use the dispatcher to fetch logs
      const filter = this.filterSubject.getValue();
      const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
      
      if (currentLogs.length > 0) {
        // Only fetch logs newer than our most recent one
        filter.afterTimestamp = currentLogs[0].timestamp;
      }
      
      this.logDispatch.fetchLogs(this.buildFilterParams(filter))
        .subscribe(response => {
          if (response.status) {
            // Append new logs to existing ones
            const updatedLogs = [...response.logs, ...currentLogs];
            this._logsSubject.next(updatedLogs); // Corrected to _logsSubject
          }
        });
    }
    
    // Return the current value of logsSubject
    return this._logsSubject.asObservable(); // Corrected to _logsSubject
  }
  
  /**
   * New log entry observable for real-time updates
   */
  get newLogEntry$(): Observable<LogEntry> {
    // Create a new subject for new log entries
    const newLogEntrySubject = new Subject<LogEntry>();
    
    // Listen for socket events to forward new log entries
    if (this.socket) {
      this.socket.on('backend-log-entry', (response: SocketResponse<LogEntry>) => { // Changed LogSocketResponse
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
  private generateMockLogEntry(): DisplayLogEntry { // Removed unused 'level' parameter
    const sources = ['AppModule', 'TypeDiagnosticsService', 'ConfigService', 'ExampleService', 'SystemLoader'];
    const logLevels = [LogLevelEnum.DEBUG, LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR, LogLevelEnum.TRACE, LogLevelEnum.FATAL]; // Renamed from levels to logLevels
    const actions = ['initialize', 'registerValidator', 'update', 'query', 'validate'];
    const mockMessagesArray = ['Mock message A', 'Mock event B', 'Test log C']; // Defined mockMessagesArray
    const mockSourcesArray = ['MockSource1', 'TestSource2', 'SampleSource3']; // Defined mockSourcesArray
    
    const randomLevel = logLevels[Math.floor(Math.random() * logLevels.length)]; // Use logLevels array
    const source = sources[Math.floor(Math.random() * sources.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    let messageText = ''; // Renamed from message
    let logDetails: Record<string, unknown> = {}; // Renamed from data, and to use details
    
    // Define all possible variables outside of switch cases to avoid ESLint warnings
    const typeNames = ['MetricData', 'LogResponse', 'UserProfile', 'ConnectionSettings'];
    const typeName = typeNames[Math.floor(Math.random() * typeNames.length)];
    
    switch (source) {
      case 'TypeDiagnosticsService':
        messageText = `${action === 'registerValidator' ? 'Registered validator for type: ' : 'Validating type: '}${typeName}`;
        logDetails = { // Changed data to logDetails
          service: 'TypeDiagnosticsService',
          action: action,
          typeName: typeName,
          validatorsCount: Math.floor(Math.random() * 10) + 1
        };
        break;
        
      case 'ConfigService':
        messageText = 'Running in development mode';
        logDetails = { // Changed data to logDetails
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
        messageText = `${source} ${action}ed successfully`;
        logDetails = { // Changed data to logDetails
          service: source,
          action: action,
          timestamp: new Date().toISOString()
        };
        break;
    }
    
    return {
      id: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: randomLevel, // Use the generated randomLevel
      message: `Mock log entry: ${mockMessagesArray[Math.floor(Math.random() * mockMessagesArray.length)]}`, // Use mockMessagesArray
      source: mockSourcesArray[Math.floor(Math.random() * mockSourcesArray.length)], // Use mockSourcesArray
      details: { details: 'Mock data details', value: Math.random(), ...logDetails }, // Changed additionalData to details and spread logDetails
      // ... other properties for DisplayLogEntry
    } as DisplayLogEntry; // Cast to DisplayLogEntry
  }

  /**
   * Filter logs using the base LogFilter interface
   * This provides compatibility with systems expecting to work with the basic LogFilter
   */
  filterWithBasicFilter(filter: LogFilter): LogEntry[] {
    const currentLogs = this._logsSubject.getValue(); // Corrected to _logsSubject
    return this.applyFilter(currentLogs, filter);
  }

  /**
   * Get statistics about logs
   */
  getStatistics(filter?: Partial<LogFilter>): Observable<LogStatsResult> {
    // Build query parameters
    const params = filter ? this.buildFilterParams(filter) : {};
    
    // Add endpoint URL
    const url = `${this.apiBaseUrl}/logger/stats`;
    
    return this.http.get<{ status: boolean, stats: LogStatsResult }>(url, { params }).pipe(
      map(response => response.stats),
      catchError(error => { // catchError is now imported
        console.error('Error fetching log statistics', error);
        return of({
          totalCount: 0,
          byLevel: {
            [LogLevelEnum.DEBUG]: 0,
            [LogLevelEnum.INFO]: 0,
            [LogLevelEnum.WARN]: 0,
            [LogLevelEnum.ERROR]: 0,
            [LogLevelEnum.FATAL]: 0,
            [LogLevelEnum.TRACE]: 0
          },
          bySource: {}
        } as LogStatsResult);
      })
    );
  }
}
