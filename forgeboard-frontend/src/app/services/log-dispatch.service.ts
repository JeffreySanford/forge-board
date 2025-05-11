import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LogEntry, LogResponse, LogLevelEnum } from '@forge-board/shared/api-interfaces'; // Ensure LogEntry and LogResponse are imported as types

/**
 * Dedicated service for dispatching logs to the backend
 * Prevents circular dependency issues between logger and HTTP interceptors
 */
@Injectable({
  providedIn: 'root'
})
export class LogDispatchService {
  // Cast environment to specific type to access properties
  private readonly typedEnv = environment as unknown as {
    apiBaseUrl: string;
    apiUrl: string;
    logsPath: string;
  };
  
  private primaryApiUrl = this.typedEnv.apiBaseUrl || this.typedEnv.apiUrl || 'http://localhost:3000/api';
  
  // Track if real API is available or if we're using mock data
  private useRealApi = true;
  private failedRequestCount = 0;
  private MAX_RETRIES = 2;

  constructor(private http: HttpClient) {}

  /**
   * Send logs to the server - now sends logs individually instead of in batch
   */
  sendLogs(logs: LogEntry[]): Observable<{ success: boolean }> {
    // If no logs, return success immediately
    if (!logs.length) {
      return of({ success: true });
    }
    
    // If we've already determined real API isn't available, use mock data
    if (!this.useRealApi) {
      console.warn('API unavailable, using mock log submission (simulated success).');
      return of({ success: true }); // Simulate success for mock
    }
    
    // Process each log individually
    try {      logs.forEach(log => {
        // Use the environment's logsPath if available, otherwise use default 'logs'
        const logsPath = this.typedEnv.logsPath || 'logs';
        const url = `${this.primaryApiUrl}/${logsPath}`;
        
        this.http.post(url, log).pipe(
          catchError(() => { // Removed unused _err parameter
            this.handleApiFailure();
            return of(null); 
          })
        ).subscribe(); // Subscribe to trigger the POST
      });
      return of({ success: true }); // Assume success if all posts initiated
    } catch (error) { // Renamed _error to error
      console.error('Error processing logs for dispatch:', error);
      this.handleApiFailure(); // Ensure API failure is handled
      return of({ success: false });
    }
  }

  /**
   * Fetch logs from the server with fallback to mock data
   */
  fetchLogs(params?: Record<string, string>): Observable<LogResponse> {
    // If we've already determined real API isn't available, use mock data immediately
    if (!this.useRealApi) {
      // console.warn('API unavailable, using mock log data for fetchLogs.');
      return of(this.getMockLogResponse());
    }
    
    // Create HttpParams instance from params object
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key]; // Use intermediate const
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value); // Removed non-null assertion
        }
      });
    }    // Use the environment's logsPath if available, otherwise use default 'logs'
    const logsPath = this.typedEnv.logsPath || 'logs';
    const url = `${this.primaryApiUrl}/${logsPath}`;

    return this.http.get<LogResponse>(url, { params: httpParams }).pipe(
      tap(() => {
        // Reset failed request count on successful API call
        this.failedRequestCount = 0;
      }),
      catchError(() => { // Removed unused _err parameter
        this.handleApiFailure();
        return of(this.getMockLogResponse()); // Fallback to mock data
      })
    );
  }
  
  /**
   * Handle API failures by counting and switching to mock data after max retries
   */
  private handleApiFailure(): void {
    this.failedRequestCount++;
    if (this.failedRequestCount >= this.MAX_RETRIES) {
      console.warn(
        `API failed ${this.failedRequestCount} times, switching to mock data for logs.`
      );
      this.useRealApi = false;
    }
  }
  
  /**
   * Generate mock log data for when the API is unavailable
   */
  private getMockLogResponse(): LogResponse {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: LogLevelEnum.INFO,
        message: 'Application started successfully',
        source: 'MockLogService',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        level: LogLevelEnum.INFO,
        message: 'Connected to mock data source',
        source: 'DataService',
      },
      {
        id: '3',
        timestamp: new Date().toISOString(),
        level: LogLevelEnum.WARN,
        message: 'API server unavailable, using mock data',
        source: 'LogDispatchService',
      }
    ];
    
    return {
      logs: mockLogs,
      totalCount: mockLogs.length,
      filtered: false,
      status: true, // Explicitly set status to true for mock success
      timestamp: new Date().toISOString()
    };
  }
}
