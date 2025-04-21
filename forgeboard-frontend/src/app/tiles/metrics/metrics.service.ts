import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Define interfaces for better type safety
interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  [key: string]: number | string; // Allow additional properties if needed
}

interface MetricResponse {
  success: boolean;
  message?: string;
}

@Injectable({
    providedIn: 'root',
})
export class MetricsService {
    private readonly apiUrl = 'http://localhost:3000/api/metrics'; // Replace with your NestJS API endpoint

    constructor(private http: HttpClient) {}

    // Method to register metrics with proper typing
    registerMetrics(data: MetricData): Observable<MetricResponse> {
        return this.http.post<MetricResponse>(`${this.apiUrl}/register`, data);
    }

    // Method to receive metrics as an observable stream
    getMetricsStream(): Observable<{ cpu: number; memory: number; time: string }> {
        return this.http.get<{ cpu: number; memory: number; time: string }>(
            `${this.apiUrl}/stream`
        ).pipe(
            catchError(error => {
                console.error('Error fetching metrics:', error);
                // return a neutral fallback so the polling continues
                return of({ cpu: 0, memory: 0, time: new Date().toISOString() });
            })
        );
    }
}