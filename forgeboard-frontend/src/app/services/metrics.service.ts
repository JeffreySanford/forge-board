import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, Subscription, of } from 'rxjs';
import { tap, catchError, retry } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { MetricData, MetricResponse, SocketResponse } from '@forge-board/shared/api-interfaces';
import { BackendStatusService } from './backend-status.service';

/**
 * This service uses two core libraries:
 * 
 * - RxJS: Provides Observables and Subjects for real-time data streams, error handling, and resource cleanup.
 * - socket.io-client: Manages the WebSocket connection to the backend.
 * 
 * Together, these libraries allow the service to:
 *   - Open a persistent WebSocket connection to the backend.
 *   - Listen for metric events and push them into an RxJS Subject.
 *   - Expose a real-time Observable stream of metrics to Angular components.
 *   - Clean up all resources (unsubscribe, disconnect) automatically in ngOnDestroy.
 */

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly socketUrl = 'http://localhost:3000';
  private readonly apiUrl = 'http://localhost:3000/api/metrics';
  private metricsSubject = new Subject<MetricData>();
  private subscriptions = new Subscription();
  private intervalSubject = new BehaviorSubject<number>(500);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // Track connection errors
  private connectionError: Error | null = null;
  private connectionErrorSubject = new Subject<Error | null>();
  
  // Generate mock data when socket isn't available
  private mockDataInterval: any;
  
  // Track reconnection attempts
  private reconnecting = false;
  private backendAvailableListener: () => void;

  // Add a specific subject for mock data state changes
  private mockDataStatusSubject = new BehaviorSubject<boolean>(false);
  
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {
    console.log('[MetricsService] Initializing service');
    this.backendStatusService.registerGateway('metrics');
    this.initSocket();
    
    // Start generating mock data if socket fails
    this.connectionErrorSubject.subscribe(error => {
      if (error) {
        console.log('[MetricsService] Connection error detected, starting mock data generation');
        this.backendStatusService.updateGatewayStatus('metrics', false, true);
        this.mockDataStatusSubject.next(true);
        this.startMockDataGeneration();
      } else {
        console.log('[MetricsService] Connection established, stopping mock data generation');
        this.backendStatusService.updateGatewayStatus('metrics', true, false);
        this.mockDataStatusSubject.next(false);
        this.stopMockDataGeneration();
      }
    });
    
    // Listen for backend availability to reconnect
    this.backendAvailableListener = () => {
      console.log('[MetricsService] Backend available event received, attempting reconnection');
      if (this.mockDataInterval && !this.reconnecting) {
        this.reconnectToBackend();
      }
    };
    
    window.addEventListener('backend-available', this.backendAvailableListener);
  }

  ngOnDestroy(): void {
    console.log('[MetricsService] Destroying service, cleaning up resources');
    this.subscriptions.unsubscribe();
    this.stopMockDataGeneration();
    
    // Remove event listener
    window.removeEventListener('backend-available', this.backendAvailableListener);
    
    if (this.socket) {
      console.log('[MetricsService] Disconnecting socket');
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('system-metrics');
      this.socket.off('connect_error');
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
    this.metricsSubject.complete();
    this.intervalSubject.complete();
    this.connectionStatusSubject.complete();
    this.connectionErrorSubject.complete();
    this.mockDataStatusSubject.complete();
  }

  private initSocket(): void {
    try {
      console.log('[MetricsService] Initializing socket connection to', `${this.socketUrl}/metrics`);
      // Configure socket with CORS options and the correct namespace
      this.socket = io(`${this.socketUrl}/metrics`, {
        withCredentials: false, // Try without credentials for CORS
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        timeout: 5000, // Set a reasonable timeout
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        console.log('[MetricsService] Socket connected successfully');
        this.connectionStatusSubject.next(true);
        this.backendStatusService.updateGatewayStatus('metrics', true, false);
        this.connectionErrorSubject.next(null);
        this.mockDataStatusSubject.next(false); // Ensure mock data status is updated
        this.socket?.emit('subscribe-metrics');
      });
      
      this.socket.on('disconnect', () => {
        console.log('[MetricsService] Socket disconnected');
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('metrics', false, false);
      });
      
      this.socket.on('system-metrics', (data: SocketResponse<MetricData>) => {
        if (data.status === 'success') {
          console.log('[MetricsService] Received metrics data:', data.data);
          this.metricsSubject.next(data.data);
        } else {
          console.error('[MetricsService] Error in metrics data:', data);
        }
      });
      
      this.socket.on('connect_error', (err) => {
        console.error('[MetricsService] Socket connection error:', err);
        this.connectionError = err;
        this.connectionErrorSubject.next(err);
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('metrics', false, false);
        this.mockDataStatusSubject.next(true); // Update mock data status
      });
    } catch (err) {
      console.error('[MetricsService] Socket initialization error:', err);
      this.connectionError = err instanceof Error ? err : new Error(String(err));
      this.connectionErrorSubject.next(this.connectionError);
      this.backendStatusService.updateGatewayStatus('metrics', false, false);
      this.startMockDataGeneration();
    }
  }

  /**
   * Attempt to reconnect to the backend when it becomes available again
   */
  private reconnectToBackend(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;
    
    console.log('[MetricsService] Attempting to reconnect to backend');
    
    // Perform a connection test first to verify the backend is truly available
    this.http.get<{status: string}>(`${this.apiUrl}/status`)
      .pipe(
        catchError(() => {
          console.log('[MetricsService] Backend still not available during reconnection');
          this.reconnecting = false;
          return of({ status: 'error' });
        })
      )
      .subscribe(response => {
        if (response && response.status !== 'error') {
          console.log('[MetricsService] Backend confirmed available, reconnecting socket');
          this.performSocketReconnection();
        } else {
          this.reconnecting = false;
        }
      });
  }
  
  /**
   * Perform the actual socket reconnection after confirming backend is available
   */
  private performSocketReconnection(): void {
    // Clean up the existing socket if any
    if (this.socket) {
      console.log('[MetricsService] Cleaning up old socket');
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('system-metrics');
      this.socket.off('connect_error');
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
    
    // Initialize a new socket connection
    try {
      console.log('[MetricsService] Creating new socket connection');
      this.socket = io(`${this.socketUrl}/metrics`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      this.socket.on('connect', () => {
        console.log('[MetricsService] Socket reconnected successfully!');
        this.connectionStatusSubject.next(true);
        this.connectionErrorSubject.next(null);
        this.mockDataStatusSubject.next(false); // Update mock data status
        
        // Stop mock data and update backend status
        this.stopMockDataGeneration();
        this.backendStatusService.updateGatewayStatus('metrics', true, false);
        
        // Subscribe to metrics
        this.socket?.emit('subscribe-metrics');
        this.socket?.emit('set-interval', this.intervalSubject.getValue());
      });
      
      this.socket.on('disconnect', () => {
        console.log('[MetricsService] Socket disconnected during reconnection');
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('metrics', false, false);
      });
      
      this.socket.on('system-metrics', (data: SocketResponse<MetricData>) => {
        if (data.status === 'success') {
          console.log('[MetricsService] Received real metrics data after reconnection');
          this.metricsSubject.next(data.data);
          
          // Make extra sure mock data generation is stopped
          if (this.mockDataInterval) {
            this.stopMockDataGeneration();
          }
        }
      });
      
      this.socket.on('connect_error', (err) => {
        console.error('[MetricsService] Socket reconnection error:', err);
        this.connectionStatusSubject.next(false);
        
        // Don't go back to mock data right away, let the normal error flow handle it
        this.backendStatusService.updateGatewayStatus('metrics', false, false);
      });
    } catch (err) {
      console.error('[MetricsService] Socket reconnection failed:', err);
    }
    
    // Reset reconnection flag after a delay
    setTimeout(() => {
      this.reconnecting = false;
    }, 5000);
  }

  getMetricsStream(): Observable<MetricData> {
    return this.metricsSubject.asObservable();
  }
  
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  getConnectionError(): Observable<Error | null> {
    return this.connectionErrorSubject.asObservable();
  }

  /**
   * Returns an observable that emits true when using mock data
   * and false when using real data
   */
  getMockDataStatus(): Observable<boolean> {
    return this.mockDataStatusSubject.asObservable();
  }

  setMetricsInterval(interval: number): Observable<MetricResponse> {
    this.intervalSubject.next(interval);
    
    // If mock data is active, adjust its interval
    if (this.mockDataInterval) {
      this.updateMockInterval(interval);
    }
    
    return this.http.get<MetricResponse>(
      `${this.apiUrl}/set-interval?interval=${interval}`
    ).pipe(
      tap(() => {
        this.socket?.emit('set-interval', interval);
      }),
      catchError(() => {
        return this.handleError<MetricResponse>({
          success: false,
          message: 'Failed to update interval'
        });
      })
    );
  }

  // HTTP fallback for registering metrics
  registerMetrics(data: MetricData): Observable<MetricResponse> {
    return this.http.post<MetricResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        catchError(error => {
          return this.handleError<MetricResponse>({ success: false, message: error.message });
        })
      );
  }

  private handleError<T>(fallbackValue: T): Observable<T> {
    return of(fallbackValue);
  }
  
  // Generate mock data when the socket connection fails
  private startMockDataGeneration(): void {
    if (this.mockDataInterval) return;
    
    console.log('[MetricsService] Starting mock data generation due to connection issues');
    const interval = this.intervalSubject.getValue();
    
    this.mockDataInterval = setInterval(() => {
      const now = new Date();
      const mockMetric: MetricData = {
        cpu: 40 + Math.random() * 20,
        memory: 60 + Math.random() * 15,
        time: now.toISOString(),
        disk: 55 + Math.random() * 10,
        network: 30 + Math.random() * 25
      };
      console.log('[MetricsService] Generated mock data:', mockMetric);
      this.metricsSubject.next(mockMetric);
    }, interval);

    // Update backend status
    this.backendStatusService.updateGatewayStatus('metrics', false, true);
  }
  
  private stopMockDataGeneration(): void {
    if (this.mockDataInterval) {
      console.log('[MetricsService] Stopping mock data generation');
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
      
      // Update backend status
      this.backendStatusService.updateGatewayStatus('metrics', true, false);
    }
  }
  
  private updateMockInterval(interval: number): void {
    console.log('[MetricsService] Updating mock interval to', interval);
    this.stopMockDataGeneration();
    
    this.mockDataInterval = setInterval(() => {
      const now = new Date();
      const mockMetric: MetricData = {
        cpu: 40 + Math.random() * 20,
        memory: 60 + Math.random() * 15,
        time: now.toISOString(),
        disk: 55 + Math.random() * 10,
        network: 30 + Math.random() * 25
      };
      this.metricsSubject.next(mockMetric);
    }, interval);
  }
}
