import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { LogEntry, LogLevelType, LogFilter, LogResponse } from '@forge-board/shared/api-interfaces';

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
  private autoSendTimer: any;

  constructor(private http: HttpClient) {
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
        return of({ logs: [], totalCount: 0, filtered: false });
      })
    );
  }

  /**
   * Add a log entry to the local store and optionally send to server
   */
  logMessage(level: LogLevelType, message: string, source: string = 'app', data?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      id: uuid(),
      level,
      message,
      source,
      timestamp: new Date().toISOString(),
      data
    };

    // Add to local logs
    this.addLog(logEntry);
    
    // Add to buffer for sending to server
    this.logBuffer.push(logEntry);
    
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

  debug(message: string, source?: string, data?: any): void {
    this.logMessage('debug' as LogLevelType, message, source, data);
  }

  info(message: string, source?: string, data?: any): void {
    this.logMessage('info' as LogLevelType, message, source, data);
  }

  warning(message: string, source?: string, data?: any): void {
    this.logMessage('warning' as LogLevelType, message, source, data);
  }

  error(message: string, source?: string, data?: any): void {
    this.logMessage('error' as LogLevelType, message, source, data);
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
    
    this.http.post(`${this.apiUrl}/batch`, { logs: logsToSend }).pipe(
      catchError(error => {
        console.error('Error sending logs to server:', error);
        // Put logs back in buffer
        this.logBuffer = [...logsToSend, ...this.logBuffer];
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Notify subscribers of updated logs
   */
  private notifySubscribers(): void {
    this.logsSubject.next([...this.logs]);
  }
}
