import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

// Socket Information Types
export interface SocketInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: {
    type: string;
    timestamp: string | Date;
    data?: Record<string, unknown>;
  }[];
}

export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
}

export interface SocketStatusUpdate {
  activeSockets: SocketInfo[];
  metrics: SocketMetrics;
}

export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: Record<string, unknown>;
}

export interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  details: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService implements OnDestroy {  // API URLs
  private readonly apiUrl = 'http://localhost:3000/api/diagnostics';
  private readonly socketUrl = 'http://localhost:3000';
  private readonly DIAGNOSTICS_NAMESPACE = 'diagnostics'; // Define namespace as a constant
  
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
  
  constructor(private http: HttpClient) {
    this.initSocket();
  }

  ngOnDestroy(): void {
    console.log('DiagnosticsService: Cleaning up resources');
    
    // Clean up socket connection
    this.cleanupSocket();
    
    // Complete all subjects
    this.socketStatusSubject.complete();
    this.socketLogsSubject.complete();
    this.healthSubject.complete();
    this.connectionStatusSubject.complete();
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
   */  private initSocket(): void {
    try {
      console.log('DiagnosticsService: Initializing socket connection');
      
      // Clean up any existing socket first to prevent duplicate connections
      this.cleanupSocket();
        // Create new socket connection with proper options
      this.socket = io(`${this.socketUrl}/${this.DIAGNOSTICS_NAMESPACE}`, {
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
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from diagnostics socket');
      this.connectionStatusSubject.next(false);
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Diagnostics socket connection error:', err);
      this.connectionStatusSubject.next(false);
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
        this.healthSubject.next(response.data);
      }
    });
  }
  
  /**
   * Get socket status updates as an observable
   */
  getSocketStatus(): Observable<SocketStatusUpdate> {
    // Request latest socket status
    if (this.socket?.connected) {
      this.socket.emit('get-socket-status');
    }
    return this.socketStatusSubject.asObservable();
  }
  
  /**
   * Get socket logs as an observable
   */
  getSocketLogs(): Observable<SocketLogEvent[]> {
    // Request latest logs
    if (this.socket?.connected) {
      this.socket.emit('get-socket-logs');
    }
    return this.socketLogsSubject.asObservable();
  }
  
  /**
   * Get health data as an observable
   */
  getHealthUpdates(): Observable<HealthData> {
    // Request latest health data
    if (this.socket?.connected) {
      this.socket.emit('get-health');
    }
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
    return this.http.get<HealthData>(`${this.apiUrl}/health`).pipe(
      catchError(() => of({
        status: 'error',
        uptime: 0,
        timestamp: new Date().toISOString(),
        details: {
          message: 'Failed to fetch health data'
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
}
