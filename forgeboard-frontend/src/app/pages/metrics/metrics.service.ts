import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

// Define proper interfaces for type safety
export interface MetricUpdateResponse {
  success: boolean;
  data?: MetricData;
  message?: string;
}

export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  [key: string]: number | string;
}

export interface MetricResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  private readonly apiUrl = 'http://localhost:3000/api/metrics';
  private readonly socketUrl = 'http://localhost:3000'; // Adjust if needed

  private socket: Socket | null = null;
  private metricsSubject = new Subject<MetricData>();

  constructor(private http: HttpClient) {
    this.initSocket();
  }

  // HTTP fallback for registering metrics
  registerMetrics(data: MetricData): Observable<MetricResponse> {
    return this.http.post<MetricResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        timeout(5000),
        catchError(error => {
          console.error('Error registering metrics:', error);
          return [{ success: false, message: error.message }];
        })
      );
  }

  // HTTP fallback for polling metrics
  getMetricsStream(): Observable<MetricData> {
    // Prefer socket if available
    return this.metricsSubject.asObservable();
  }

  // Initialize and manage the socket connection
  private initSocket() {
    this.socket = io(this.socketUrl, { path: '/socket.io' });

    this.socket.on('connect', () => {
      console.log('Metrics socket connected');
      this.socket?.emit('subscribeMetrics');
    });

    this.socket.on('metricsUpdate', (data: MetricData) => {
      this.metricsSubject.next(data);
    });

    this.socket.on('system-metrics', (response: SocketResponse<MetricData>) => {
      // Extract data from standardized response
      if (response.status === 'success') {
        this.metricsSubject.next(response.data);
      } else {
        console.error('Received invalid metrics response:', response);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Metrics socket disconnected');
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err);
    });
  }

  // Clean up socket connection
  ngOnDestroy(): void {
    // Clean up socket connection initialized with socketUrl
    if (this.socket) {
      // Remove all listeners to prevent memory leaks
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('metricsUpdate');
      this.socket.off('system-metrics');
      
      // Disconnect the socket
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Complete all subjects
    this.metricsSubject.complete();
  }
}
