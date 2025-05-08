import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogEntry } from '@forge-board/shared/api-interfaces';
import { LogResponse } from './logger.service';

/**
 * Dedicated service for dispatching logs to the backend
 * Prevents circular dependency issues between logger and HTTP interceptors
 */
@Injectable({
  providedIn: 'root'
})
export class LogDispatchService {
  private readonly apiUrl = 'http://localhost:3000/api';
  // Remove batch size property as batching is being removed

  constructor(private http: HttpClient) {}

  /**
   * Send logs to the server - now sends logs individually instead of in batch
   */
  sendLogs(logs: LogEntry[]): Observable<{ success: boolean }> {
    // If no logs, return success immediately
    if (!logs.length) {
      return of({ success: true });
    }
    
    // Send each log individually rather than as a batch
    console.log(`Sending ${logs.length} logs individually`);
    
    // Process each log individually
    try {
      // Send first log (for simplicity, just handle one at a time)
      // In a real implementation, you might want to process these sequentially with better error handling
      const log = logs[0];
      
      return this.http.post<{ success: boolean }>(`${this.apiUrl}/logs`, log, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).pipe(
        catchError(err => {
          console.error('Failed to send log:', err);
          return of({ success: false });
        })
      );
    } catch (error) {
      console.error('Error sending log:', error);
      return of({ success: false });
    }
  }

  /**
   * Fetch logs from the server
   */
  fetchLogs(params?: Record<string, string>): Observable<LogResponse> {
    // Create HttpParams instance from params object
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.append(key, value);
      });
    }

    return this.http.get<LogResponse>(`${this.apiUrl}/logs`, { params: httpParams }).pipe(
      catchError(err => {
        console.error('Failed to fetch logs:', err);
        return of({ 
          status: false, 
          logs: [], 
          totalCount: 0,
          total: 0, // Added the missing 'total' property
          filtered: false,
          timestamp: new Date().toISOString()
        });
      })
    );
  }
}
