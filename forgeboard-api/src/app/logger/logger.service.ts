import { Injectable, Logger as NestLogger, OnModuleDestroy } from '@nestjs/common';
import { LogLevelEnum, LogFilter, LogEntry } from '@forge-board/shared/api-interfaces';
import { v4 as uuid } from 'uuid';
import { Observable, BehaviorSubject, Subject, map, filter as rxFilter, shareReplay, of, take, bufferTime, forkJoin } from 'rxjs'; // Removed from, concatMap, toArray
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from '../models/log.model';

// Define the shape of log statistics
export interface LogStatsResult {
  totalCount: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}

// Define service names for loop prevention to avoid circular dependencies if importing services
const LOGS_SERVICE_NAME = 'LogsService';
const LOGGER_SERVICE_NAME = 'LoggerService';

/**
 * Logger service providing reactive log management
 * 
 * Features:
 * - Real-time log stream via hot observables (BehaviorSubject for current logs, Subject for new entries)
 * - Batched stream of new log entries (`batchedNewLogEntries$`) for efficient real-time updates.
 * - Filtering and querying capabilities for historical logs
 * - Integrates with MongoDB for persistence
 * - Supports various log levels
 * 
 * @example
 * // Subscribe to filtered logs
 * loggerService.getLogs({ level: LogLevelEnum.ERROR }).subscribe(logs => {
 *   console.log(`Found ${logs.length} error logs`);
 * });
 * 
 * // Log a new message and react to it
 * loggerService.info('User logged in', 'auth-service', { userId: '123' })
 *   .subscribe(logEntry => console.log(`Log created with ID: ${logEntry.id}`));
 */
@Injectable()
export class LoggerService implements OnModuleDestroy {
  private readonly nestLoggerInstance = new NestLogger(LOGGER_SERVICE_NAME); // Renamed to avoid confusion with the class name
  
  /**
   * BehaviorSubject to store and emit logs as a hot observable
   * New subscribers immediately receive the current logs
   */
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  
  private readonly maxLogs = 1000; // Maximum number of logs to keep in memory
  private readonly enableConsoleOutput: boolean;
  
  /**
   * Subject to notify subscribers when a new log is created
   * This is a true hot observable - only emits new logs after subscription.
   * Consider using `batchedNewLogEntries$` for more efficient real-time updates
   * if individual log emissions are too frequent.
   */
  public readonly newLogEntry$ = new Subject<LogEntry>();

  /**
   * Observable that batches new log entries from `newLogEntry$`.
   * Emits an array of log entries collected over a specified time interval (e.g., 1 second)
   * or after a certain number of entries have accumulated (e.g., 100), whichever comes first.
   * Only emits non-empty batches. This is useful for reducing the frequency of updates
   * to clients or other services consuming real-time logs.
   * The stream is shared and replays the last emitted batch to new subscribers.
   */
  public readonly batchedNewLogEntries$: Observable<LogEntry[]>;

  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {
    // Set to false in production to avoid duplicate logging
    this.enableConsoleOutput = process.env.NODE_ENV !== 'production';
    this.nestLoggerInstance.log('Logger Service initialized with reactive streams');

    this.batchedNewLogEntries$ = this.newLogEntry$.pipe(
      bufferTime(1000, undefined, 100), // Buffer for 1000ms or 100 entries
      rxFilter(batch => batch.length > 0), // Don't emit empty batches
      shareReplay({ bufferSize: 1, refCount: true }) // Share the batched stream
    );
  }

  /**
   * Clean up resources when the module is destroyed
   */
  onModuleDestroy(): void {
    this.nestLoggerInstance.log('LoggerService cleaning up resources');
    this.logsSubject.complete();
    this.newLogEntry$.complete();
    // batchedNewLogEntries$ will complete automatically when newLogEntry$ completes.
  }

  // Create a log entry with the specified level
  log(level: LogLevelEnum, message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    const entry: LogEntry = {
      id: uuid(),
      level,
      message,
      source: context,
      timestamp: new Date().toISOString(),
      details: meta,
      context
    };

    // Output to console first, using direct console calls to avoid recursion
    // This happens regardless of meta-logging status, as console output itself shouldn't loop here.
    if (this.enableConsoleOutput) {
      const consoleMessage = `[${entry.source || 'app'}] ${entry.message}`;
      // Only include meta if it has keys, to avoid logging empty objects
      const metaDetails = Object.keys(entry.details || {}).length > 0 ? entry.details : '';
      
      switch (entry.level) {
        case LogLevelEnum.TRACE: // Assuming TRACE maps to debug for console
        case LogLevelEnum.DEBUG:
          console.debug(consoleMessage, metaDetails);
          break;
        case LogLevelEnum.INFO:
          console.log(consoleMessage, metaDetails);
          break;
        case LogLevelEnum.WARN:
          console.warn(consoleMessage, metaDetails);
          break;
        case LogLevelEnum.ERROR:
        case LogLevelEnum.FATAL:
          console.error(consoleMessage, metaDetails);
          break;
        default: {
          // Fallback for unknown levels, ensuring level is a string for console.
          const levelStr = typeof entry.level === 'string' ? entry.level : String(entry.level);
          console.log(`[${levelStr.toUpperCase()}] ${consoleMessage}`, metaDetails);
          break;
        }
      }
    }

    // Loop prevention for meta-logging: Do not save or stream logs about logging itself.
    if (this.isMetaLogging(entry.source, entry.message)) {
      // Meta-log already printed to console (if enabled).
      // Return an observable with the entry, but it won't be processed further by DB/stream.
      return of(entry);
    }

    // Add to in-memory logs and notify subscribers
    const currentLogs = this.logsSubject.getValue();
    const updatedLogs = [entry, ...currentLogs].slice(0, this.maxLogs);
    this.logsSubject.next(updatedLogs);

    // Save to database
    const logDocument = new this.logModel({
      level: entry.level,
      message: entry.message,
      source: entry.source,
      timestamp: new Date(entry.timestamp), // Ensure Date object for Mongoose
      details: entry.details,
      context: entry.context
    });
    logDocument.save().catch(dbError => {
      // Log DB save errors directly to console to avoid loops
      console.error(`[${LOGGER_SERVICE_NAME}] Failed to save log to DB:`, dbError, entry);
    });

    // Emit the new log entry
    this.newLogEntry$.next(entry);

    // Return an observable that emits the entry and completes.
    // This allows callers to know when the log has been emitted to the newLogEntry$ stream.
    return this.newLogEntry$.pipe(
      rxFilter(log => log.id === entry.id),
      take(1)
    );
  }
  
  // Convenience methods
  debug(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.DEBUG, message, context, meta);
  }
  
  info(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.INFO, message, context, meta);
  }
  
  warning(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.WARN, message, context, meta);
  }
  
  error(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.ERROR, message, context, meta);
  }

  fatal(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.FATAL, message, context, meta);
  }

  trace(message: string, context = 'app', meta: Record<string, unknown> = {}): Observable<LogEntry> {
    return this.log(LogLevelEnum.TRACE, message, context, meta); // Changed from DEBUG to TRACE
  }
  
  /**
   * Get logs with optional filtering
   * Returns a hot observable stream of log entries based on the current in-memory store.
   * The stream is shared and replays the last emitted filtered list to new subscribers.
   * `refCount: true` ensures the underlying mapping and filtering logic is only active
   * when there are active subscribers.
   */
  getLogs(filter: LogFilter = { level: LogLevelEnum.INFO }): Observable<LogEntry[]> {
    return this.logsSubject.pipe(
      map(logs => {
        let filteredLogs = [...logs];
        
        // Apply filter logic here
        if (filter.level) {
          if (Array.isArray(filter.level)) {
            filteredLogs = filteredLogs.filter(log => 
              filter.level && Array.isArray(filter.level) && filter.level.includes(log.level)
            );
          } else {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level);
          }
        }
        
        if (filter.service) {
          filteredLogs = filteredLogs.filter(log => log.source === filter.service);
        }
        
        if (filter.startDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) >= new Date(filter.startDate)
          );
        }
        
        if (filter.endDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) <= new Date(filter.endDate)
          );
        }
        
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filteredLogs = filteredLogs.filter(log =>
            log.message.toLowerCase().includes(searchLower) || 
            (log.source && log.source.toLowerCase().includes(searchLower))
          );
        }
        
        if (filter.skip && filter.skip > 0) {
          filteredLogs = filteredLogs.slice(filter.skip);
        }
        
        if (filter.afterTimestamp) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) > new Date(filter.afterTimestamp)
          );
        }
        
        // Apply limit last after all other filters
        if (filter.limit && filter.limit > 0) {
          filteredLogs = filteredLogs.slice(0, filter.limit);
        }
        
        return filteredLogs;
      }),
      // Make it hot with replay to ensure all subscribers get the same filtered data
      // refCount: true ensures the source observable (logsSubject mapping) is torn down when no subscribers.
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
  
  // Add logs - method needed by controller
  addLogs(logs: LogEntry[]): Observable<LogEntry[]> {
    if (!logs || logs.length === 0) {
      return of([]);
    }

    // Standardize each log entry and prepare an observable for its processing
    const logProcessingObservables = logs.map(log => {
      const entryToLog: LogEntry = {
        id: log.id || uuid(),
        level: log.level,
        message: log.message,
        source: log.source || 'app',
        timestamp: log.timestamp || new Date().toISOString(),
        details: log.details || {},
        context: log.context || log.source || 'app'
      };
      // this.log returns an Observable that completes when the log is processed
      return this.log(
        entryToLog.level,
        entryToLog.message,
        entryToLog.source,
        entryToLog.details
      );
    });

    // Use forkJoin to process all logs in parallel and emit an array of results when all complete.
    // If sequential processing is strictly needed (e.g., to maintain order for some side effect not captured by the return),
    // `from(logProcessingObservables).pipe(concatMap(obs => obs), toArray())` could be an alternative,
    // but forkJoin is generally more performant for independent async operations.
    return forkJoin(logProcessingObservables);
  }
  
  // Create many log entries - method needed by controller
  createMany(logDtos: LogEntry[]): Observable<LogEntry[]> {
    const createdLogs: LogEntry[] = [];
    
    logDtos.forEach(logDto => {
      // Store the log result but don't use `log` directly as it was causing an eslint warning
      this.log(
        logDto.level,
        logDto.message,
        logDto.source || 'app',
        logDto.details || {}
      );
      
      createdLogs.push({ ...logDto, id: uuid() });
    });
    
    // Create a dedicated subject for the operation result
    const resultSubject = new BehaviorSubject<LogEntry[]>(createdLogs);
    return resultSubject.asObservable();
  }
  
  // Get log statistics - method needed by controller
  getLogStatistics(filter: Partial<LogFilter> = {}): Observable<LogStatsResult> {
    return this.getLogs(filter as LogFilter).pipe(
      map(logs => {
        const stats: LogStatsResult = {
          totalCount: logs.length,
          byLevel: {} as Record<LogLevelEnum, number>, // Ensure keys are LogLevelEnum
          bySource: {} as Record<string, number>
        };
        
        logs.forEach(log => {
          // log.level is already LogLevelEnum
          stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
          
          if (log.source) {
            stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
          }
        });
        
        return stats;
      })
    );
  }
  
  // Get log by ID - method needed by controller
  getLogById(id: string): Observable<LogEntry | null> {
    return this.logsSubject.pipe(
      map(logs => logs.find(log => log.id === id) || null)
    );
  }
  
  // Delete log by ID - method needed by controller
  deleteLog(id: string): Observable<boolean> {
    const currentLogs = this.logsSubject.getValue();
    const initialLength = currentLogs.length;
    const updatedLogs = currentLogs.filter(log => log.id !== id);
    
    // Update the subject with filtered logs
    this.logsSubject.next(updatedLogs);
    
    // Also delete from database
    this.logModel.deleteOne({ id }).exec();
    
    // Create a dedicated subject for the operation result
    const resultSubject = new BehaviorSubject<boolean>(updatedLogs.length < initialLength);
    return resultSubject.asObservable();
  }
  
  // Clear logs matching filter - method needed by controller
  clearLogs(filter: Partial<LogFilter> = {}): Observable<number> {
    const currentLogs = this.logsSubject.getValue();
    const initialLength = currentLogs.length;
    let filteredLogs = [...currentLogs];
    
    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level !== filter.level);
    }
    
    if (filter.service) {
      filteredLogs = filteredLogs.filter(log => log.source !== filter.service);
    }
    
    if (filter.endDate) {
      // Fixed non-null assertion by checking if endDate exists in the filter
      // before using it in the filter operation
      const endDateStr = filter.endDate;
      if (endDateStr) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) > new Date(endDateStr)
        );
      }
    }
    
    const deletedCount = initialLength - filteredLogs.length;
    
    // Update the subject with filtered logs
    this.logsSubject.next(filteredLogs);
    
    // Delete from database as well
    // Define query with proper type
    const query: Record<string, unknown> = {};
    if (filter.level) query.level = filter.level;
    if (filter.service) query.source = filter.service;
    if (filter.endDate) query.timestamp = { $lte: new Date(filter.endDate) };
    
    this.logModel.deleteMany(query).exec();
    
    // Create a dedicated subject for the operation result
    const resultSubject = new BehaviorSubject<number>(deletedCount);
    return resultSubject.asObservable();
  }
  
  /**
   * Check if a log entry matches a filter
   */
  private logMatchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    // Check level (entry.level and filter.level are LogLevelEnum)
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        if (!filter.level.includes(entry.level)) {
          return false;
        }
      } else if (entry.level !== filter.level) {
        return false;
      }
    }
    
    // Check service property instead of sources
    if (filter.service && entry.source !== filter.service) {
      return false;
    }
    
    // Safely check for entry.timestamp without non-null assertion
    if (filter.startDate && entry.timestamp && new Date(entry.timestamp) < new Date(filter.startDate)) {
      return false;
    }
    
    if (filter.endDate && entry.timestamp && new Date(entry.timestamp) > new Date(filter.endDate)) {
      return false;
    }
    
    // Check search term in message or source
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (
        !entry.message.toLowerCase().includes(searchLower) && 
        (!entry.source || !entry.source.toLowerCase().includes(searchLower))
      ) {
        return false;
      }
    }
    
    return true;
  }

  private isMetaLogging(source: string | undefined, message: string): boolean {
    if (!source) return false; // If no source, assume not meta-logging

    const lowerSource = source.toLowerCase().trim(); // Added .trim()
    const lowerMessage = message.toLowerCase();

    // Check if the source is one of the logging services
    if (lowerSource === LOGGER_SERVICE_NAME.toLowerCase() || lowerSource === LOGS_SERVICE_NAME.toLowerCase()) {
      const metaKeywords = ['log', 'saved', 'sending', 'sent', 'logger', 'logging', 'stream', 'filter', 'failed to save log']; // Added 'sent'
      if (metaKeywords.some(keyword => lowerMessage.includes(keyword))) {
        // This console.debug is safe as it's a direct call, not going through this.log()
        // It's useful for knowing when a meta-log was detected and skipped.
        console.debug(`[${LOGGER_SERVICE_NAME}] Meta-log detected. Skipping full processing for: [${source}] "${message.substring(0,100)}..."`);
        return true;
      }
    }
    return false;
  }
}
