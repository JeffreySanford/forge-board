import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

// Define proper interfaces for type safety
interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  [key: string]: number | string; // Allow additional properties
}

interface MetricResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService {
  // Update URL if your API runs on a different port (typically NestJS uses 3000)
  private readonly apiUrl = 'http://localhost:3000/api/metrics';

  constructor(private http: HttpClient) {
    // Log on service initialization to confirm URL
    console.log('MetricsService initialized with API URL:', this.apiUrl);
  }

  registerMetrics(data: MetricData): Observable<MetricResponse> {
    console.log('Attempting to register metrics:', data);
    return this.http.post<MetricResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        timeout(5000), // Add timeout to avoid hanging requests
        catchError(error => {
          console.error('Error registering metrics:', error);
          return of({ success: false, message: error.message });
        })
      );
  }

  getMetricsStream(): Observable<{ cpu: number; memory: number; time: string }> {
    console.log('Fetching metrics stream from:', `${this.apiUrl}/stream`);
    return this.http.get<{ cpu: number; memory: number; time: string }>(
      `${this.apiUrl}/stream`
    ).pipe(
      timeout(3000),
      catchError(error => {
        console.error('Error fetching metrics:', error);
        // Check network connection issues
        if (error.status === 0) {
          console.warn('Network error - check if the API server is running and CORS is configured');
        }
        // return a neutral fallback so the polling continues
        return of({ cpu: 0, memory: 0, time: new Date().toISOString() });
      })
    );
  }
}
