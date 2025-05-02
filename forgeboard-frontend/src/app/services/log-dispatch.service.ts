import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  private readonly maxBatchSize = 50; // Maximum number of logs per batch

  constructor(private http: HttpClient) {}

  /**
   * Send logs to the server
   */
  sendLogs(logs: LogEntry[]): Observable<{ success: boolean }> {
    // If logs array is too large, split into batches
    if (logs.length > this.maxBatchSize) {
      console.log(`Logs batch too large (${logs.length}), splitting into batches of ${this.maxBatchSize}`);
      
      // Split logs into smaller batches
      const batches: LogEntry[][] = [];
      for (let i = 0; i < logs.length; i += this.maxBatchSize) {
        batches.push(logs.slice(i, i + this.maxBatchSize));
      }
      
      // Send each batch separately
      const batchRequests = batches.map(batch => 
        this.http.post<{ success: boolean }>(`${this.apiUrl}/logs/batch`, batch, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).pipe(
          catchError(err => {
            console.error(`Failed to send logs batch (${batch.length} logs):`, err);
            return of({ success: false });
          })
        )
      );
      
      // Combine the results
      return forkJoin(batchRequests).pipe(
        map(results => {
          const allSuccess = results.every(result => result.success);
          return { success: allSuccess };
        })
      );
    }
    
    // For smaller batches, send as is
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/logs/batch`, logs, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      catchError(err => {
        console.error('Failed to send logs:', err);
        return of({ success: false });
      })
    );
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
