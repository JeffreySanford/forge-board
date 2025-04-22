import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MetricData } from '@forge-board/shared/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private readonly apiUrl = 'http://localhost:3000/api/metrics';

  constructor(private http: HttpClient) {}

  /**
   * Get a stream of metrics data
   * @returns Observable of metrics data
   */
  getMetricsStream(): Observable<MetricData> {
    return this.http.get<MetricData>(`${this.apiUrl}/stream`)
      .pipe(
        catchError(error => {
          console.error('Error fetching metrics:', error);
          // Return placeholder data on error
          return of({
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            time: new Date().toISOString()
          });
        })
      );
  }

  /**
   * Set the metrics polling interval
   * @param interval Polling interval in milliseconds
   * @returns Observable of the response
   */
  setMetricsInterval(interval: number): Observable<{ success: boolean, interval: number }> {
    return this.http.get<{ success: boolean, interval: number }>(`${this.apiUrl}/set-interval?interval=${interval}`);
  }
}
