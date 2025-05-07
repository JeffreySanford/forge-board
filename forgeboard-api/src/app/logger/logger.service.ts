import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { LogLevelEnum, LogFilter, LogEntry } from '@forge-board/shared/api-interfaces';
import { v4 as uuid } from 'uuid';
import { Observable, BehaviorSubject, Subject, map, filter as rxFilter } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from '../models/log.model';

// Define the shape of log statistics
export interface LogStatsResult {
  totalCount: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}

@Injectable()
export class LoggerService {
  private readonly nestLogger = new NestLogger(LoggerService.name);
  
  // BehaviorSubject to store and emit logs
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  
  private readonly maxLogs = 1000; // Maximum number of logs to keep in memory
  private readonly enableConsoleOutput: boolean;
  
  // Subject to notify subscribers when a new log is created
  public readonly newLogEntry$ = new Subject<LogEntry>();

  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {
    // Set to false in production to avoid duplicate logging
    this.enableConsoleOutput = process.env.NODE_ENV !== 'production';
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

    // Add to in-memory logs and notify subscribers
    const currentLogs = this.logsSubject.getValue();
    const updatedLogs = [entry, ...currentLogs].slice(0, this.maxLogs);
    this.logsSubject.next(updatedLogs);

    // Output to console if enabled
    if (this.enableConsoleOutput) {
      switch (level) {
        case LogLevelEnum.DEBUG:
          this.nestLogger.debug(message, context);
          break;
        case LogLevelEnum.INFO:
          this.nestLogger.log(message, context);
          break;
        case LogLevelEnum.WARN:
          this.nestLogger.warn(message, context);
          break;
        case LogLevelEnum.ERROR:
          this.nestLogger.error(message, context);
          break;
        case LogLevelEnum.FATAL:
          this.nestLogger.error(`FATAL: ${message}`, context);
          break;
      }
    }

    // Save to database
    const logDocument = new this.logModel({
      level,
      message,
      source: context,
      timestamp: new Date(),
      details: meta,
      context
    });
    logDocument.save();

    // Emit the new log entry
    this.newLogEntry$.next(entry);

    // Return an observable with the entry
    return this.newLogEntry$.pipe(
      rxFilter(log => log.id === entry.id)
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
    return this.log(LogLevelEnum.DEBUG, message, context, meta);
  }
  
  // Get logs with optional filtering - match the method signature used in controller
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
      })
    );
  }
  
  // Add logs - method needed by controller
  addLogs(logs: LogEntry[]): Observable<boolean> {
    logs.forEach(log => {
      this.log(
        log.level,
        log.message,
        log.source || 'app',
        log.details || {}
      );
    });
    
    // Create a dedicated subject for the operation result
    const resultSubject = new BehaviorSubject<boolean>(true);
    return resultSubject.asObservable();
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
    // Use the logs observable and map it to statistics
    return this.getLogs(filter as LogFilter).pipe(
      map(logs => {
        const stats: LogStatsResult = {
          totalCount: logs.length,
          byLevel: {} as Record<string, number>,
          bySource: {} as Record<string, number>
        };
        
        // Count by level
        logs.forEach(log => {
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
    // Check level
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
}
