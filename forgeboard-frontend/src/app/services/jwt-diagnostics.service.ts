import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { SocketResponse } from '@forge-board/shared/api-interfaces';
import { BackendStatusService } from './backend-status.service';

// Types for JWT diagnostics
export type AuthEventType = 
  | 'login-success' 
  | 'login-fail' 
  | 'token-validate-success' 
  | 'token-validate-fail'
  | 'logout';

export interface AuthDiagnosticEvent {
  id: string;
  type: AuthEventType;
  username?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthStats {
  totalAttempts: number;
  successCount: number;
  failCount: number;
  lastActivity: string;
  activeTokens: number;
}

@Injectable({
  providedIn: 'root'
})
export class JwtDiagnosticsService implements OnDestroy {
  // API URLs
  private readonly apiUrl = 'http://localhost:3000/api/diagnostics/auth';
  private readonly socketUrl = 'http://localhost:3000';
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Subjects
  private authEventsSubject = new BehaviorSubject<AuthDiagnosticEvent[]>([]);
  private authStatsSubject = new BehaviorSubject<AuthStats>({
    totalAttempts: 0,
    successCount: 0,
    failCount: 0,
    lastActivity: '',
    activeTokens: 0
  });
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Mock data interval
  private mockDataInterval: any = null;
  
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {
    // Initialize socket connection
    this.initSocket();
  }
  
  ngOnDestroy(): void {
    // Clean up resources
    this.cleanupSocket();
    
    // Complete subjects
    this.authEventsSubject.complete();
    this.authStatsSubject.complete();
    this.connectionStatusSubject.complete();
    
    // Stop mock data generation
    this.stopMockDataGeneration();
  }
  
  // Clean up socket connection
  private cleanupSocket(): void {
    if (this.socket) {
      console.log('JwtDiagnosticsService: Disconnecting socket');
      
      // Remove event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('auth-events');
      this.socket.off('auth-stats');
      this.socket.off('connect_error');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
  }
  
  // Initialize socket connection
  private initSocket(): void {
    try {
      console.log('JwtDiagnosticsService: Initializing socket connection');
      
      // Clean up existing socket
      this.cleanupSocket();
      
      // Create new socket connection
      this.socket = io(`${this.socketUrl}/auth-diagnostics`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      // Set up socket events
      this.setupSocketEvents();
    } catch (err) {
      console.error('Failed to connect to auth diagnostics socket:', err);
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('auth-diagnostics', false, false);
      this.startMockDataGeneration();
    }
  }
  
  // Set up socket event handlers
  private setupSocketEvents(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to auth diagnostics socket');
      this.connectionStatusSubject.next(true);
      this.backendStatusService.updateGatewayStatus('auth-diagnostics', true, false);
      this.stopMockDataGeneration();
      
      // Request initial data
      this.socket?.emit('get-auth-events');
      this.socket?.emit('get-auth-stats');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from auth diagnostics socket');
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('auth-diagnostics', false, false);
      this.startMockDataGeneration();
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Auth diagnostics socket connection error:', err);
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('auth-diagnostics', false, false);
      this.startMockDataGeneration();
    });
    
    this.socket.on('auth-events', (response: SocketResponse<AuthDiagnosticEvent[]>) => {
      if (response.status === 'success') {
        this.authEventsSubject.next(response.data);
      }
    });
    
    this.socket.on('auth-stats', (response: SocketResponse<AuthStats>) => {
      if (response.status === 'success') {
        this.authStatsSubject.next(response.data);
      }
    });
  }
  
  // Get auth events as observable
  getAuthEvents(): Observable<AuthDiagnosticEvent[]> {
    // Request latest events if connected
    if (this.socket?.connected) {
      this.socket.emit('get-auth-events');
    }
    return this.authEventsSubject.asObservable();
  }
  
  // Get auth stats as observable
  getAuthStats(): Observable<AuthStats> {
    // Request latest stats if connected
    if (this.socket?.connected) {
      this.socket.emit('get-auth-stats');
    }
    return this.authStatsSubject.asObservable();
  }
  
  // Get connection status as observable
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  // Get auth events via HTTP API
  getAuthEventsHttp(): Observable<AuthDiagnosticEvent[]> {
    return this.http.get<AuthDiagnosticEvent[]>(`${this.apiUrl}/events`).pipe(
      tap(events => this.authEventsSubject.next(events)),
      catchError(() => {
        const mockEvents: AuthDiagnosticEvent[] = this.generateMockEvents();
        this.authEventsSubject.next(mockEvents);
        return of(mockEvents);
      })
    );
  }
  
  // Get auth stats via HTTP API
  getAuthStatsHttp(): Observable<AuthStats> {
    return this.http.get<AuthStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.authStatsSubject.next(stats)),
      catchError(() => {
        const mockStats: AuthStats = this.generateMockStats();
        this.authStatsSubject.next(mockStats);
        return of(mockStats);
      })
    );
  }
  
  // Start mock data generation
  private startMockDataGeneration(): void {
    // Ensure we clear any existing interval first
    if (this.mockDataInterval !== null) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
    
    console.log('JwtDiagnosticsService: Starting mock data generation');
    
    // Generate mock stats
    const mockStats: AuthStats = {
      totalAttempts: 42,
      successCount: 38,
      failCount: 4,
      lastActivity: new Date().toISOString(),
      activeTokens: 5
    };
    
    // Generate mock events
    const mockEvents: AuthDiagnosticEvent[] = this.generateMockEvents();
    
    // Update subjects with initial mock data
    this.authStatsSubject.next(mockStats);
    this.authEventsSubject.next(mockEvents);
    
    // Set up interval for periodic updates
    this.mockDataInterval = setInterval(() => {
      // Update timestamp
      mockStats.lastActivity = new Date().toISOString();
      
      // Random increments
      if (Math.random() > 0.7) {
        mockStats.totalAttempts++;
        if (Math.random() > 0.2) {
          mockStats.successCount++;
        } else {
          mockStats.failCount++;
        }
      }
      
      // Occasionally add new mock event
      if (Math.random() > 0.7) {
        const newEvent = this.generateMockEvent();
        mockEvents.unshift(newEvent);
        if (mockEvents.length > 50) {
          mockEvents.pop();
        }
        this.authEventsSubject.next([...mockEvents]);
      }
      
      // Update stats
      this.authStatsSubject.next({...mockStats});
    }, 5000);
    
    // Update backend status
    this.backendStatusService.updateGatewayStatus('auth-diagnostics', false, true);
  }
  
  // Stop mock data generation
  private stopMockDataGeneration(): void {
    if (this.mockDataInterval) {
      console.log('JwtDiagnosticsService: Stopping mock data generation');
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
  }
  
  // Generate mock events
  private generateMockEvents(): AuthDiagnosticEvent[] {
    const events: AuthDiagnosticEvent[] = [];
    const types: AuthEventType[] = [
      'login-success',
      'login-fail',
      'token-validate-success',
      'token-validate-fail',
      'logout'
    ];
    
    const usernames = [
      'admin',
      'user1',
      'developer',
      'guest',
      'system'
    ];
    
    // Generate 20 random events
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const success = type.includes('fail') ? false : true;
      const username = usernames[Math.floor(Math.random() * usernames.length)];
      
      events.push({
        id: `mock-${i}`,
        type,
        username,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        success,
        errorMessage: success ? undefined : 'Mock error message',
        metadata: {
          isMock: true,
          mockId: i
        }
      });
    }
    
    return events;
  }
  
  // Generate a single mock event
  private generateMockEvent(): AuthDiagnosticEvent {
    const types: AuthEventType[] = [
      'login-success',
      'login-fail',
      'token-validate-success',
      'token-validate-fail',
      'logout'
    ];
    
    const usernames = [
      'admin',
      'user1',
      'developer',
      'guest',
      'system'
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const success = type.includes('fail') ? false : true;
    const username = usernames[Math.floor(Math.random() * usernames.length)];
    
    return {
      id: `mock-${Date.now()}`,
      type,
      username,
      timestamp: new Date().toISOString(),
      success,
      errorMessage: success ? undefined : 'Mock error message',
      metadata: {
        isMock: true,
        generated: Date.now()
      }
    };
  }
  
  // Generate mock stats
  private generateMockStats(): AuthStats {
    return {
      totalAttempts: 42,
      successCount: 38,
      failCount: 4,
      lastActivity: new Date().toISOString(),
      activeTokens: 5
    };
  }
}
