import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

// Define interfaces for better type safety
export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  [key: string]: number | string; // Allow additional properties if needed
}

export interface MetricResponse {
  success: boolean;
  message?: string;
}

// Standard socket response format for consistency
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  private readonly apiUrl = 'http://localhost:3000/api/metrics';
  private readonly socketUrl = 'http://localhost:3000';

  private socket: Socket | null = null;
  private metricsSubject = new Subject<MetricData>();
  private defaultMetrics: MetricData = { 
    cpu: 0, 
    memory: 0, 
    time: new Date().toISOString() 
  };

  constructor(private http: HttpClient) {
    this.initSocket();
  }

  // HTTP method to register metrics
  registerMetrics(data: MetricData): Observable<MetricResponse> {
    return this.http.post<MetricResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        timeout(5000),
        catchError(error => {
          console.error('Error registering metrics:', error);
          return of({ success: false, message: error.message || 'Unknown error' });
        })
      );
  }

  // Get metrics as an observable stream
  getMetricsStream(): Observable<MetricData> {
    // Return subject as observable to prevent external emission
    return this.metricsSubject.asObservable();
  }

  // Initialize socket connection
  private initSocket(): void {
    try {
      this.socket = io(this.socketUrl, {
        reconnectionAttempts: 5,
        timeout: 10000
      });
      
      this.setupSocketEventHandlers();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      // Emit default metrics on failure
      this.metricsSubject.next(this.defaultMetrics);
    }
  }

  // Setup socket event handlers
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Metrics socket connected');
      this.socket?.emit('subscribe-metrics');
    });

    this.socket.on('metrics-update', (response: SocketResponse<MetricData>) => {
      if (response.status === 'success') {
        this.metricsSubject.next(response.data);
      } else {
        console.error('Metrics error:', response);
        // Emit default metrics on error
        this.metricsSubject.next(this.defaultMetrics);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`Metrics socket disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      // Emit default metrics on connection error
      this.metricsSubject.next(this.defaultMetrics);
    });
  }

  // Clean up socket connection
  ngOnDestroy(): void {
    if (this.socket) {
      // Remove all listeners to prevent memory leaks
      this.socket.off('connect');
      this.socket.off('metrics-update');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Complete subject to prevent memory leaks
    this.metricsSubject.complete();
  }
}