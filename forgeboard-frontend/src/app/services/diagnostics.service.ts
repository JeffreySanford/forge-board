import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { 
  SocketResponse, 
  SocketInfo, 
  SocketMetrics, 
  SocketStatusUpdate,
  SocketLogEvent,
  HealthData,
  validateMetricData,
  ValidationResult,
} from '@forge-board/shared/api-interfaces';
import { BackendStatusService } from './backend-status.service';
import { TypeDiagnosticsService } from './type-diagnostics.service';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService implements OnDestroy {
  // API URLs
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly socketUrl = 'http://localhost:3000';
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Socket data subjects
  private socketStatusSubject = new Subject<SocketStatusUpdate>();
  private socketLogsSubject = new Subject<SocketLogEvent[]>();
  private healthSubject = new BehaviorSubject<HealthData>({
    status: 'unknown',
    uptime: 0,
    timestamp: new Date().toISOString(),
    details: {}
  });
  
  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Add mock data functionality
  private mockDataInterval: ReturnType<typeof setInterval> | null = null;
  private readonly defaultSocketMetrics: SocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
  };
  
  // Add reconnection properties
  private reconnecting = false;
  private backendAvailableListener: () => void;
  
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService,
    private typeDiagnostics: TypeDiagnosticsService
  ) {
    // Initialize socket and event listener
    this.backendAvailableListener = () => {
      if (!this.socket?.connected && !this.reconnecting) {
        this.reconnectToBackend();
      }
    };
    
    window.addEventListener('backend-available', this.backendAvailableListener);
    
    // Register validators
    this.typeDiagnostics.registerValidator('MetricData', validateMetricData);
    
    // Initialize socket
    this.initSocket();
  }

  ngOnDestroy(): void {
    console.log('DiagnosticsService: Cleaning up resources');
    
    // Remove event listener
    window.removeEventListener('backend-available', this.backendAvailableListener);
    
    // Clean up socket connection
    this.cleanupSocket();
    
    // Complete all subjects
    this.socketStatusSubject.complete();
    this.socketLogsSubject.complete();
    this.healthSubject.complete();
    this.connectionStatusSubject.complete();
    
    // Stop mock data generation
    this.stopMockDataGeneration();
  }
  
  /**
   * Properly clean up socket connection
   */
  private cleanupSocket(): void {
    if (this.socket) {
      console.log('DiagnosticsService: Disconnecting socket');
      
      // Remove all event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('socket-status');
      this.socket.off('socket-logs');
      this.socket.off('health-update');
      this.socket.off('connect_error');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
  }
  
  /**
   * Initialize socket connection to diagnostics namespace
   */
  private initSocket(): void {
    try {
      console.log('DiagnosticsService: Initializing socket connection');
      
      // Clean up any existing socket first to prevent duplicate connections
      this.cleanupSocket();
      
      // Create new socket connection with proper options
      this.socket = io(`${this.socketUrl}/diagnostics`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true // Force new connection to avoid conflicts
      });
      
      // Setup socket event handlers
      this.setupSocketEvents();
    } catch (err) {
      console.error('Failed to connect to diagnostics socket:', err);
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
      this.startMockDataGeneration();
    }
  }
  
  /**
   * Set up all socket event handlers
   */
  private setupSocketEvents(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to diagnostics socket');
      this.connectionStatusSubject.next(true);
      this.backendStatusService.updateGatewayStatus('diagnostics', true, false);
      this.stopMockDataGeneration();
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from diagnostics socket');
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Diagnostics socket connection error:', err);
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
      this.startMockDataGeneration();
    });
    
    this.socket.on('socket-status', (response: SocketResponse<SocketStatusUpdate>) => {
      if (response.status === 'success') {
        this.socketStatusSubject.next(response.data);
      }
    });
    
    this.socket.on('socket-logs', (response: SocketResponse<SocketLogEvent[]>) => {
      if (response.status === 'success') {
        this.socketLogsSubject.next(response.data);
      }
    });
    
    this.socket.on('health-update', (response: SocketResponse<HealthData>) => {
      if (response.status === 'success') {
        try {
          // Validate health data before updating the subject
          const validatedHealth = this.typeDiagnostics.validateType<HealthData>(
            response.data, 
            'HealthData', 
            'DiagnosticsService.setupSocketEvents.health-update'
          );
          this.healthSubject.next(validatedHealth);
        } catch (error) {
          console.error('Health data validation failed:', error);
          // Still update with response.data but log the error
          this.healthSubject.next(response.data);
        }
      }
    });
  }

  // Mock data generation methods
  private startMockDataGeneration(): void {
    if (this.mockDataInterval) return;
    
    console.log('DiagnosticsService: Starting mock data generation');
    
    // Generate fake health data
    const mockHealth: HealthData = {
      status: 'simulated',
      uptime: 3600,
      timestamp: new Date().toISOString(),
      details: {
        simulatedData: {
          message: 'Using simulated data - backend unavailable'
        }
      }
    };
    
    // Generate fake socket info
    const mockSocketInfo: SocketInfo = {
      id: 'mock-socket-id',
      namespace: '/diagnostics',
      clientIp: '127.0.0.1',
      userAgent: 'Mock Client',
      connectTime: new Date(),
      lastActivity: new Date(),
      events: []
    };
    
    // Set up intervals for mock data
    this.mockDataInterval = setInterval(() => {
      // Update health data with current time
      mockHealth.timestamp = new Date().toISOString();
      mockHealth.uptime = (mockHealth.uptime ?? 0) + 1;
      this.healthSubject.next({...mockHealth});
      
      // Update socket metrics with random fluctuations
      const mockMetrics = {...this.defaultSocketMetrics};
      mockMetrics.messagesSent += Math.floor(Math.random() * 5);
      mockMetrics.messagesReceived += Math.floor(Math.random() * 3);
      
      // Update socket status
      this.socketStatusSubject.next({
        activeSockets: [mockSocketInfo],
        metrics: mockMetrics
      });
      
      // Generate random log events occasionally
      if (Math.random() > 0.7) {
        const eventTypes = ['connect', 'message', 'ping', 'status'];
        const randomEvent: SocketLogEvent = {
          socketId: 'mock-socket-id',
          namespace: '/diagnostics',
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          timestamp: new Date(),
          message: 'Mock event generated'
        };
        this.socketLogsSubject.next([randomEvent]);
      }
    }, 2000);
    
    // Update backend status service
    this.backendStatusService.updateGatewayStatus('diagnostics', false, true);
  }
  
  private stopMockDataGeneration(): void {
    if (this.mockDataInterval) {
      console.log('DiagnosticsService: Stopping mock data generation');
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
      
      // Update backend status
      this.backendStatusService.updateGatewayStatus('diagnostics', true, false);
    }
  }

  /**
   * Attempt to reconnect to the backend when it becomes available again
   */
  private reconnectToBackend(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;
    
    console.log('[DiagnosticsService] Attempting to reconnect to backend');
    
    // Perform a connection test first to verify backend is truly available
    this.http.get<{status: string}>(`${this.apiUrl}/diagnostics/health`)
      .pipe(
        catchError(() => {
          console.log('[DiagnosticsService] Backend still not available during reconnection');
          this.reconnecting = false;
          return of({ status: 'error' });
        })
      )
      .subscribe(response => {
        if (response && response.status !== 'error') {
          console.log('[DiagnosticsService] Backend confirmed available, reconnecting socket');
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
    // Clean up the existing socket
    this.cleanupSocket();
    
    // Initialize a new socket connection
    try {
      console.log('[DiagnosticsService] Creating new socket connection');
      this.socket = io(`${this.socketUrl}/diagnostics`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      // Setup enhanced reconnection event handlers
      this.socket.on('connect', () => {
        console.log('[DiagnosticsService] Socket reconnected successfully!');
        this.connectionStatusSubject.next(true);
        
        // Stop mock data and update backend status
        this.stopMockDataGeneration();
        this.backendStatusService.updateGatewayStatus('diagnostics', true, false);
        
        // Request initial data
        this.socket?.emit('get-health');
        this.socket?.emit('get-socket-logs');
        this.socket?.emit('get-socket-history');
      });
      
      this.socket.on('disconnect', () => {
        console.log('[DiagnosticsService] Socket disconnected during reconnection');
        this.connectionStatusSubject.next(false);
        this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
      });
      
      this.socket.on('health-update', (response: SocketResponse<HealthData>) => {
        if (response.status === 'success') {
          console.log('[DiagnosticsService] Received real health data after reconnection');
          this.healthSubject.next(response.data);
          
          // Make extra sure mock data generation is stopped
          if (this.mockDataInterval) {
            this.stopMockDataGeneration();
          }
        }
      });
      
      // Setup the rest of socket event handlers
      this.setupSocketEvents();
    } catch (err) {
      console.error('[DiagnosticsService] Socket reconnection failed:', err);
    }
    
    // Reset reconnection flag after a delay
    setTimeout(() => {
      this.reconnecting = false;
    }, 5000);
  }

  /**
   * Get socket status updates as an observable
   */
  getSocketStatus(): Observable<SocketStatusUpdate> {
    // Request latest socket status
    this.socket?.emit('get-socket-history');
    return this.socketStatusSubject.asObservable();
  }
  
  /**
   * Get socket logs as an observable
   */
  getSocketLogs(): Observable<SocketLogEvent[]> {
    // Request latest logs
    this.socket?.emit('get-socket-logs');
    return this.socketLogsSubject.asObservable();
  }
  
  /**
   * Get health data as an observable
   */
  getHealthUpdates(): Observable<HealthData> {
    // Request latest health data
    this.socket?.emit('get-health');
    return this.healthSubject.asObservable();
  }
  
  /**
   * Get connection status as an observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  /**
   * Get health data via HTTP API
   */
  getHealth(): Observable<HealthData> {
    return this.http.get<HealthData>(`${this.apiUrl}/diagnostics/health`).pipe(
      map(response => {
        // Ensure the response matches the HealthData interface
        if (typeof response.status === 'string' && 
            !['healthy', 'degraded', 'unhealthy', 'unknown', 'simulated'].includes(response.status)) {
          return {
            ...response,
            status: 'unknown' as const // Force it to be a valid status
          };
        }
        return response;
      }),
      catchError(() => of({
        status: 'unknown' as const,
        uptime: 0,
        timestamp: new Date().toISOString(),
        details: {
          error: {
            message: 'Unable to connect to backend server'
          }
        }
      }))
    );
  }
  
  /**
   * Get socket information via HTTP API
   */
  getSocketInfo(): Observable<SocketStatusUpdate> {
    return this.http.get<SocketStatusUpdate>(`${this.apiUrl}/sockets`).pipe(
      catchError(() => of({
        activeSockets: [],
        metrics: {
          totalConnections: 0,
          activeConnections: 0,
          disconnections: 0,
          errors: 0,
          messagesSent: 0,
          messagesReceived: 0
        }
      }))
    );
  }

  // Custom validator for HealthData
  private validateHealthData(obj: HealthData): ValidationResult {
    const issues: string[] = [];
    
    if (!obj) {
      issues.push('Object is null or undefined');
      return { valid: false, issues };
    }
    
    if (typeof obj.status !== 'string') issues.push('Missing or invalid status (string)');
    if (typeof obj.uptime !== 'number') issues.push('Missing or invalid uptime (number)');
    if (typeof obj.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
    if (!obj.details || typeof obj.details !== 'object') {
      issues.push('Missing or invalid details (object)');
    }
    
    return { valid: issues.length === 0, issues };
  }
}
