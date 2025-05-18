import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, from, of, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Metric } from '@forge-board/shared/api-interfaces';
import { BackendStatusService } from './backend-status.service';
import { RefreshIntervalService } from '../utils/refresh-interval.service';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { SharedMetricsService } from '@forge-board/shared/services/metrics.service';

// Console styling for better debugging experience
const CONSOLE_STYLES = {
  success: 'background: #43a047; color: white; padding: 2px 6px; border-radius: 2px;',
  error: 'background: #e53935; color: white; padding: 2px 6px; border-radius: 2px;',
  warning: 'background: #ff9800; color: white; padding: 2px 6px; border-radius: 2px;',
  info: 'background: #2196f3; color: white; padding: 2px 6px; border-radius: 2px;',
  mock: 'background: linear-gradient(to right, #ff9800, #f44336); color: white; padding: 2px 6px; border-radius: 2px;'
};

// Interface for socket response data
interface MetricSocketResponse {
  status: string;
  data: Metric;
}

// Interface for socket connection errors
interface SocketConnectionError {
  message: string;
  type?: string;
  description?: string;
  code?: number | string;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService extends SharedMetricsService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly socketUrl = environment.socketBaseUrl;
  private readonly apiUrl = `${environment.apiBaseUrl}/metrics`;
  private metricsSubject = new Subject<Metric>();
  private subscriptions = new Subscription();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private connectionErrorSubject = new Subject<SocketConnectionError | null>();
  private mockDataStatusSubject = new BehaviorSubject<boolean>(false);
  private forceUseMockData = false;
  
  // Previous values for smooth transitions in mock data
  private prevCpu = 50;
  private prevMemory = 65;
  private prevDisk = 55;
  private prevNetwork = 30;
  
  // Simulation parameters
  private cpuTrend = 0;
  private memoryTrend = 0;
  private simulatedLoad = 0;
  
  // Animation properties for UI feedback
  private socketConnectionAnimation: number | null = null;

  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService,
    private refreshIntervalService: RefreshIntervalService
  ) {
    super();
    console.log('[MetricsService] Initializing service with global refresh interval');
    this.backendStatusService.registerGateway('metrics');
    this.initSocket();
    
    // When the socket connects, make sure to set the interval on the server
    this.subscriptions.add(
      this.refreshIntervalService.getIntervalObservable().subscribe(interval => {
        // ✨ FIX 1: Safely emit to socket with null check ✨
        const currentInterval = interval;
        this.safeEmit('set-interval', currentInterval, () => {
          console.log(`%c[MetricsService] Updated server interval to ${interval}ms`, CONSOLE_STYLES.success);
        });
        
        // Also update the server via REST API as a backup
        this.http.get(`${this.apiUrl}/set-interval?interval=${interval}`)
          .subscribe({
            next: () => console.log(`%c[MetricsService] REST API interval updated to ${interval}ms`, CONSOLE_STYLES.info),
            error: (err) => console.warn(`%c[MetricsService] Failed to update interval via REST`, CONSOLE_STYLES.warning, err)
          });
      })
    );
    
    // Subscribe to the refresh trigger to generate mock data when needed
    this.subscriptions.add(
      this.refreshIntervalService.getRefreshTrigger().subscribe(() => {
        // Generate mock data if we're using mock data mode (either forced or auto-fallback)
        if (this.mockDataStatusSubject.getValue()) {
          this.generateMockMetric();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.cleanupSocket();
    this.subscriptions.unsubscribe();
    // Stop any running animations
    if (this.socketConnectionAnimation) {
      cancelAnimationFrame(this.socketConnectionAnimation);
    }
  }

  /**
   * Initialize socket connection with colorful status indicators
   */
  private initSocket(): void {
    try {
      // Skip socket initialization if we're forcing mock data mode
      if (this.forceUseMockData) {
        console.log(`%c[MetricsService] Forcing mock data mode - skipping socket initialization`, CONSOLE_STYLES.warning);
        this.mockDataStatusSubject.next(true);
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('metrics', false, true);
        return;
      }

      console.log(`%c[MetricsService] Initializing socket connection to ${this.socketUrl}/metrics`, CONSOLE_STYLES.info);
      this.socket = io(`${this.socketUrl}/metrics`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        console.log(`%c[MetricsService] Socket connected successfully`, CONSOLE_STYLES.success);
        this.connectionStatusSubject.next(true);
        this.backendStatusService.updateGatewayStatus('metrics', true, false);
        this.connectionErrorSubject.next(null);
        this.mockDataStatusSubject.next(false);
        
        // ✨ FIX 2: Safely emit subscribe-metrics with null check ✨
        this.safeEmit('subscribe-metrics', undefined, () => {
          console.log(`%c[MetricsService] Subscribed to metrics stream`, CONSOLE_STYLES.success);
        });
        
        // ✨ FIX 3: Safely emit set-interval with null check ✨
        const currentInterval = this.refreshIntervalService.getInterval();
        this.safeEmit('set-interval', currentInterval, () => {
          console.log(`%c[MetricsService] Setting server interval to ${currentInterval}ms`, CONSOLE_STYLES.success);
        });
        
      });
      
      // Setup other socket event handlers with enhanced visual feedback
      this.socket.on('disconnect', () => {
        console.log(`%c[MetricsService] Socket disconnected`, CONSOLE_STYLES.warning);
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('metrics', false, false);
      });
      
      this.socket.on('connect_error', (error: SocketConnectionError) => {
        console.error(`%c[MetricsService] Connection error:`, CONSOLE_STYLES.error, error);
        this.connectionStatusSubject.next(false);
        this.connectionErrorSubject.next(error);
        this.mockDataStatusSubject.next(true);
        this.backendStatusService.updateGatewayStatus('metrics', false, true);
      });
      
      this.socket.on('system-metrics', (data: MetricSocketResponse) => {
        if (data.status === 'success') {
          // Add subtle visual effect to console for data updates
          console.log(`%c[MetricsService] Received metrics: CPU: ${typeof data.data?.cpu === 'number' ? data.data.cpu.toFixed(1) : '0.0'}%, MEM: ${typeof data.data?.memory === 'number' ? data.data.memory.toFixed(1) : '0.0'}%`, 
            'color: #43a047; font-style: italic;');
          this.metricsSubject.next(data.data);
        }
      });
      
    } catch (err) {
      console.error(`%c[MetricsService] Socket initialization error:`, CONSOLE_STYLES.error, err);
      this.connectionErrorSubject.next(err as SocketConnectionError);
      this.mockDataStatusSubject.next(true);
      this.backendStatusService.updateGatewayStatus('metrics', false, true);
    }
  }
  
  /**
   * Safely emit to socket with null check and callback
   */
  private safeEmit<T>(eventName: string, data?: T, onSuccess?: () => void): boolean {
    if (this.socket?.connected) {
      try {
        if (data !== undefined) {
          this.socket.emit(eventName, data);
        } else {
          this.socket.emit(eventName);
        }
        if (onSuccess) onSuccess();
        return true;
      } catch (err) {
        console.error(`%c[MetricsService] Error emitting ${eventName}:`, CONSOLE_STYLES.error, err);
        return false;
      }
    } else {
      console.warn(`%c[MetricsService] Cannot emit ${eventName}: Socket not connected`, CONSOLE_STYLES.warning);
      return false;
    }
  }
    
  getMetricsStream(): Observable<Metric> {
    return this.metricsSubject.asObservable();
  }
  
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  getConnectionError(): Observable<SocketConnectionError | null> {
    return this.connectionErrorSubject.asObservable();
  }
  
  getMockDataStatus(): Observable<boolean> {
    return this.mockDataStatusSubject.asObservable();
  }
  
  /**
   * Toggle between live and mock data modes
   * @param useMockData Whether to use mock data (true) or live data (false)
   */
  toggleMockData(useMockData: boolean): void {
    console.log(`%c[MetricsService] Manually ${useMockData ? 'enabling' : 'disabling'} mock data mode`, 
      useMockData ? CONSOLE_STYLES.mock : CONSOLE_STYLES.success);
    
    this.forceUseMockData = useMockData;
    
    if (useMockData) {
      // Switch to mock data mode
      this.cleanupSocket();
      this.mockDataStatusSubject.next(true);
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('metrics', false, true);
      
      // Generate initial mock data
      this.generateMockMetric();
    } else {
      // Switch back to live data mode
      this.mockDataStatusSubject.next(false);
      this.initSocket(); // This will attempt to reconnect
    }
  }
  
  // Generate a single mock metric with realistic patterns
  private generateMockMetric(): void {
    const mockMetric = this.generateMetrics();
    console.log(`%c[MetricsService] Generated mock metric`, CONSOLE_STYLES.mock);
    this.metricsSubject.next(mockMetric);
  }
  
  private cleanupSocket(): void {
    if (this.socket) {
      console.log(`%c[MetricsService] Cleaning up socket connection`, CONSOLE_STYLES.info);
      this.socket.disconnect();
      this.socket = null;
    }
  }
}