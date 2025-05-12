import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http'; // Added HttpErrorResponse
import { Observable, of } from 'rxjs'; // Removed throwError
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LogEntry, LogResponse, LogLevelEnum, ApiResponse } from '@forge-board/shared/api-interfaces'; // Ensure LogEntry and LogResponse are imported as types

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
   * Send logs to the server - now sends logs in a batch
   */
  sendLogs(logs: LogEntry[]): Observable<ApiResponse<{ count: number }>> {
    // If no logs, return success immediately
    if (!logs || logs.length === 0) {
      return of({ success: true, data: { count: 0 }, timestamp: new Date().toISOString(), statusCode: 200 });
    }
    
    // If we've already determined real API isn't available, use mock data
    if (!this.useRealApi) {
      console.warn('API unavailable, using mock log submission (simulated success).');
      return of({ success: true, data: { count: logs.length }, message: 'Mock submission due to API unavailability', timestamp: new Date().toISOString(), statusCode: 200 });
    }
    
    // Use the environment's logsPath if available, otherwise use default 'logs'
    // For batch, we'll use a dedicated '/batch' sub-path.
    const logsPath = this.typedEnv.logsPath || 'logs';
    const url = `${this.primaryApiUrl}/${logsPath}/batch`;
    return this.http.post<ApiResponse<{ count: number }>>(url, logs).pipe(
      tap((response) => {
        if (response.success) {
          this.useRealApi = true;
          this.failedRequestCount = 0;
          console.debug(`Successfully sent batch of ${response.data?.count || logs.length} logs.`);
        } else {
          // Handle cases where API returns success: false
          console.warn(`API reported failure for log batch: ${response.message}`);
          // Potentially call handleApiFailure here if server-side logical errors should also count towards retries
        }
      }),
      catchError((err: HttpErrorResponse) => {
        this.handleApiFailure();
        const errorResponse: ApiResponse<{ count: number }> = {
          success: false,
          message: `Failed to send log batch: ${err.message}`,
          timestamp: new Date().toISOString(),
          statusCode: err.status,
          data: { count: 0 }
        };
        console.error(`Error sending log batch: ${err.message}`, err);
        return of(errorResponse); // Return a structured error response
      })
    );
  }

  /**
   * Fetch logs from the server with fallback to mock data
   */
  fetchLogs(params?: Record<string, string>): Observable<LogResponse> {
    // If we've already determined real API isn't available, use mock data immediately
    if (!this.useRealApi) {
      console.warn('API unavailable, fetching mock logs.');
      return of(this.getMockLogResponse());
    }
    
    // Create HttpParams instance from params object
    let httpParams = new HttpParams();
    if (params) {
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) { // Fixed hasOwnProperty check
          httpParams = httpParams.set(key, params[key]);
        }
      }
    }
    const logsPath = this.typedEnv.logsPath || 'logs';
    const url = `${this.primaryApiUrl}/${logsPath}`;

    return this.http.get<LogResponse>(url, { params: httpParams }).pipe(
      tap(() => {
        this.useRealApi = true;
        this.failedRequestCount = 0;
        console.debug('Successfully fetched logs from API.');
      }),
      catchError((err: HttpErrorResponse) => {
        console.error(`Error fetching logs: ${err.message}`, err);
        this.handleApiFailure();
        return of(this.getMockLogResponse());
      })
    );
  }
  
  /**
   * Handle API failures by counting and switching to mock data after max retries
   */
  private handleApiFailure(): void {
    this.failedRequestCount++;
    console.warn(`API request failed. Attempt ${this.failedRequestCount} of ${this.MAX_RETRIES}.`);
    if (this.failedRequestCount >= this.MAX_RETRIES) {
      this.useRealApi = false;
      console.error(`Max API request retries (${this.MAX_RETRIES}) reached. Switching to mock data mode.`);
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
