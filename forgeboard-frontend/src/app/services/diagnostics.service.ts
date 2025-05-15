import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, timer, throwError } from 'rxjs'; // Removed EMPTY, of, switchMap, tap, retryWhen, delayWhen
import { catchError, takeUntil } from 'rxjs/operators'; // Removed switchMap, tap, retryWhen, delayWhen from here too if they were mistakenly duplicated
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment'; // Import environment
import { Environment } from '../../environments/environment.interface'; // Import Environment interface

import { BackendStatusService, BackendStatusSummary } from './backend-status.service'; // Added BackendStatusSummary
import { TypeDiagnosticsService } from './type-diagnostics.service';

import {
  HealthData,
  SocketLogEvent,
  SocketStatusUpdate,
  MetricData,
  HealthTimelinePoint, // Added HealthTimelinePoint
  SocketResponse // Import SocketResponse from shared
} from '@forge-board/shared/api-interfaces';

// Extended health data type
export interface EnhancedHealthData extends HealthData {
  clientProcessedTimestamp?: string;
  isSimulated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService implements OnDestroy {  private socket!: Socket; // Added definite assignment assertion  
  private API_URL: string; // Make API_URL configurable  
  // List of available namespaces to try in order of preference
  private readonly namespaces = ['/diagnostics', 'diagnostics', '', '/'];
  private currentNamespaceIndex = 0;

  // Socket data subjects
  private healthUpdatesSubject = new BehaviorSubject<EnhancedHealthData | null>(null);
  private socketStatusSubject = new BehaviorSubject<SocketStatusUpdate | null>(null);
  private socketLogsSubject = new BehaviorSubject<SocketLogEvent[]>([]);
  private liveMetricsSubject = new BehaviorSubject<MetricData | null>(null); // Added for live metrics
  private timelinePointsSubject = new BehaviorSubject<HealthTimelinePoint[]>([]); // New Subject for timeline points

  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  // Reconnection properties
  private reconnectionAttemptTimer = timer(5000, 10000); // Start after 5s, then every 10s
  private maxReconnectAttempts = 5;
  private currentReconnectAttempt = 0;

  // Environment configuration
  private readonly envConfig = environment as Environment; // Get environment config

  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService,
    private typeDiagnostics: TypeDiagnosticsService
  ) {    // Determine API_URL for sockets - we need the base URL without the /api path
    if (this.envConfig.socketBaseUrl) {
      // Use socketBaseUrl directly if available
      this.API_URL = this.envConfig.socketBaseUrl;
    } else if (this.envConfig.apiBaseUrl) {
      // If we only have apiBaseUrl, extract the origin
      try {
        const parsedUrl = new URL(this.envConfig.apiBaseUrl);
        this.API_URL = parsedUrl.origin; // e.g., http://localhost:3000
      } catch (e) {
        console.error('DiagnosticsService: Invalid apiBaseUrl in environment, defaulting.', e);
        this.API_URL = 'http://localhost:3000'; // Default if parsing fails
      }
    } else if (this.envConfig.apiUrl) {
      try {
        const parsedUrl = new URL(this.envConfig.apiUrl);
        this.API_URL = parsedUrl.origin; // e.g., http://localhost:3000
      } catch (e) {
        console.error('DiagnosticsService: Invalid apiUrl in environment, defaulting.', e);
        this.API_URL = 'http://localhost:3000'; // Default if parsing fails
      }
    } else {
      this.API_URL = 'http://localhost:3000'; // Default if no relevant URL in env
    }    // Check if we have a last successful namespace and prioritize it
    const lastSuccessfulNamespace = localStorage.getItem('lastSuccessfulSocketNamespace');
    if (lastSuccessfulNamespace) {
      // Find the index of the last successful namespace
      const index = this.namespaces.indexOf(lastSuccessfulNamespace);
      if (index !== -1) {
        // Move the successful namespace to the front of the array
        this.currentNamespaceIndex = index;
        console.log(`Using last successful namespace: ${lastSuccessfulNamespace}`);
      }
    }
    
    this.initializeSocketConnection();

    // Monitor backend status for reconnection
    this.backendStatusService.getStatusSummary().pipe( // Changed to getStatusSummary()
      takeUntil(this.destroy$)
    ).subscribe((status: BackendStatusSummary) => { // Explicitly typed status
      if (status.allConnected && (!this.socket || !this.socket.connected)) { // Used status.allConnected
        this.attemptReconnect();
      }
    });
  }  private initializeSocketConnection(): void {
    // Clean up any existing socket connection
    this.cleanupSocket();
    
    // Get the current namespace to try
    const currentNamespace = this.namespaces[this.currentNamespaceIndex];
    const socketUrl = `${this.API_URL}`;
    
    console.log(`DiagnosticsService: Connecting to socket at ${socketUrl} with namespace '${currentNamespace}'`);
    
    let fullUrl: string;
    if (currentNamespace === '') {
      // Connect to root namespace
      fullUrl = socketUrl;
    } else if (currentNamespace === '/') {
      // Another way to connect to root namespace
      fullUrl = socketUrl + '/';
    } else if (currentNamespace.startsWith('/')) {
      // Namespace already has leading slash
      fullUrl = socketUrl + currentNamespace;
    } else {
      // Add leading slash to namespace
      fullUrl = `${socketUrl}/${currentNamespace}`;
    }

    this.socket = io(fullUrl, {
      transports: ['websocket'],
      reconnection: false, // Disable automatic reconnection to manage it manually
      forceNew: true
    });

    this.connectionStatusSubject.next(false);    this.socket.on('connect', () => {
      this.connectionStatusSubject.next(true);
      this.currentReconnectAttempt = 0; // Reset reconnect attempts on successful connection
      const currentNamespace = this.namespaces[this.currentNamespaceIndex];
      console.log(`Successfully connected to diagnostics socket with namespace '${currentNamespace}'.`);
      
      // Store the successful namespace for future connections
      localStorage.setItem('lastSuccessfulSocketNamespace', currentNamespace);
      
      // Update backend status service to reflect connected state
      this.backendStatusService.updateGatewayStatus('diagnostics', true, false);
      this.setupSocketEventHandlers();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatusSubject.next(false);
      console.log(`Disconnected from diagnostics socket: ${reason}`);
      // Update backend status service to reflect disconnected state
      this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
        // Attempt to reconnect if not a manual disconnect
        this.attemptReconnect();
      }
    });    this.socket.on('connect_error', (error) => {
      this.connectionStatusSubject.next(false);
      const currentNamespace = this.namespaces[this.currentNamespaceIndex];
      console.error(`Diagnostics socket connection error with namespace '${currentNamespace}':`, error);
      console.error('Connection details:', {
        url: fullUrl,
        namespace: currentNamespace,
        baseUrl: socketUrl,
        path: '/socket.io'
      });
      
      // Check if error message indicates namespace issues
      const errorMsg = error.toString();
      const isNamespaceError = errorMsg.includes('Invalid namespace') || errorMsg.includes('Namespace not found');
      
      // Update backend status service to reflect error state
      this.backendStatusService.updateGatewayStatus('diagnostics', false, false);
      
      // Try the next namespace if available
      if (this.currentNamespaceIndex < this.namespaces.length - 1) {
        this.currentNamespaceIndex++;
        console.log(`Trying next namespace: ${this.namespaces[this.currentNamespaceIndex]}`);
        this.initializeSocketConnection();
      } else {
        // Reset to the first namespace for next reconnection attempt
        this.currentNamespaceIndex = 0;
        if (isNamespaceError) {
          console.warn('All namespace attempts failed. The server might be using a different namespace configuration.');
        }
        this.attemptReconnect(); // Attempt to reconnect after delay
      }
    });
  }
  
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Refined handleResponse function
    const handleResponse = <T>(eventData: SocketResponse<T> | T, subject: BehaviorSubject<T | null>) => {
      // Check if eventData is a SocketResponse object (from socket-types.ts)
      if (eventData && typeof eventData === 'object' && 'data' in eventData && 'event' in eventData && 'status' in eventData) {
        const socketResp = eventData as SocketResponse<T>;
        if (socketResp.status === 'success') {
          subject.next(socketResp.data);
        } else {
          console.error(`Received error response for event ${socketResp.event}: ${socketResp.message}`);
          subject.next(null); // Or handle error state appropriately
        }
      } else {
        // Assume eventData is of type T directly
        subject.next(eventData as T | null);
      }
    };

    this.socket.on('health-update', (receivedData: SocketResponse<HealthData> | HealthData) => {
      let actualData: HealthData | null = null;
      if (receivedData && typeof receivedData === 'object' && 'data' in receivedData && 'event' in receivedData && 'status' in receivedData) {
        const socketResp = receivedData as SocketResponse<HealthData>;
        if (socketResp.status === 'success') {
          actualData = socketResp.data;
        } else {
          console.error(`Health update error for event ${socketResp.event}: ${socketResp.message}`);
        }
      } else {
        actualData = receivedData as HealthData;
      }

      if (actualData) {
        const enhancedData: EnhancedHealthData = {
          ...(actualData), // No longer need to cast actualData to HealthData if types are correct
          clientProcessedTimestamp: new Date().toISOString()
        };
        this.healthUpdatesSubject.next(enhancedData);
      } else {
        this.healthUpdatesSubject.next(null);
      }
    });

    this.socket.on('socket-status', (data: SocketResponse<SocketStatusUpdate> | SocketStatusUpdate) => {
       handleResponse<SocketStatusUpdate>(data, this.socketStatusSubject);
    });
    this.socket.on('socket-logs', (receivedData: SocketResponse<SocketLogEvent[]> | SocketLogEvent[]) => {
      let actualData: SocketLogEvent[] | null = null;
      if (receivedData && typeof receivedData === 'object' && 'data' in receivedData && 'event' in receivedData && 'status' in receivedData) {
        const socketResp = receivedData as SocketResponse<SocketLogEvent[]>;
        if (socketResp.status === 'success') {
          actualData = socketResp.data;
        } else {
          console.error(`Socket logs error for event ${socketResp.event}: ${socketResp.message}`);
        }
      } else {
        actualData = receivedData as SocketLogEvent[];
      }
      this.socketLogsSubject.next(actualData || []); // Ensure it's an array
    });
    this.socket.on('live-metric-update', (data: SocketResponse<MetricData> | MetricData) => {
      handleResponse<MetricData>(data, this.liveMetricsSubject);
    });

    // Listen for timeline updates
    this.socket.on('timeline-update', (receivedData: SocketResponse<HealthTimelinePoint[]> | HealthTimelinePoint[]) => {
      let actualData: HealthTimelinePoint[] | null = null;
      if (receivedData && typeof receivedData === 'object' && 'data' in receivedData && 'event' in receivedData && 'status' in receivedData) {
        const socketResp = receivedData as SocketResponse<HealthTimelinePoint[]>;
        if (socketResp.status === 'success') {
          actualData = socketResp.data;
        } else {
          console.error(`Timeline update error for event ${socketResp.event}: ${socketResp.message}`);
        }
      } else {
        actualData = receivedData as HealthTimelinePoint[];
      }
      this.timelinePointsSubject.next(actualData || []); // Ensure it's an array
    });

    // Request initial data upon connection (optional, if backend sends it)
    this.socket.emit('request-initial-timeline');
  }  private attemptReconnect(): void {
    if (this.currentReconnectAttempt < this.maxReconnectAttempts && (!this.socket || !this.socket.connected)) {
      this.currentReconnectAttempt++;
      console.log(`Attempting to reconnect to diagnostics socket... (Attempt ${this.currentReconnectAttempt}/${this.maxReconnectAttempts})`);
      
      // Reset namespace index to try all namespaces again
      this.currentNamespaceIndex = 0;
      
      // Use a timer for delay before retrying connection
      timer(3000 * this.currentReconnectAttempt) // Exponential backoff
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (!this.socket || !this.socket.connected) {
            this.initializeSocketConnection(); // Re-initialize the connection attempt
          }
        });
    } else if (this.currentReconnectAttempt >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for diagnostics socket.');
    }
  }
  /**
   * Cleans up socket connections and event listeners
   */
  private cleanupSocket(): void {
    if (this.socket) {
      // Remove event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('health-update');
      this.socket.off('socket-status');
      this.socket.off('socket-logs');
      this.socket.off('live-metric-update');
      this.socket.off('timeline-update');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      console.log('DiagnosticsService: Socket cleaned up.');
    }
  }  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up socket connection explicitly in ngOnDestroy to satisfy ESLint rule
    this.cleanupSocket();
    
    // Complete all subjects
    this.healthUpdatesSubject.complete();
    this.socketStatusSubject.complete();
    this.socketLogsSubject.complete();
    this.liveMetricsSubject.complete();
    this.timelinePointsSubject.complete();
    this.connectionStatusSubject.complete();
    
    console.log('DiagnosticsService: Socket disconnected and service destroyed.');
  }

  // Public Observables
  public getLiveMetrics(): Observable<MetricData | null> {
    return this.liveMetricsSubject.asObservable();
  }

  public getSocketStatus(): Observable<SocketStatusUpdate | null> {
    return this.socketStatusSubject.asObservable();
  }
  
  public getSocketLogs(): Observable<SocketLogEvent[]> {
    return this.socketLogsSubject.asObservable();
  }
  
  public getHealthUpdates(): Observable<EnhancedHealthData | null> {
    return this.healthUpdatesSubject.asObservable();
  }
  
  public getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  // New method to get timeline points
  public getTimelinePoints(): Observable<HealthTimelinePoint[]> {
    return this.timelinePointsSubject.asObservable();
  }
    // HTTP methods
  public getHealth(): Observable<HealthData> {
    // For HTTP calls, use the apiBaseUrl from environment which includes /api path
    return this.http.get<HealthData>(`${this.envConfig.apiBaseUrl}/diagnostics/health`).pipe(
      catchError(err => {
        console.error('Error fetching health data via HTTP', err);
        return throwError(() => err);
      })
    );
  }
  
  public getSocketInfo(): Observable<SocketStatusUpdate> {
    // For HTTP calls, use the apiBaseUrl from environment which includes /api path
    return this.http.get<SocketStatusUpdate>(`${this.envConfig.apiBaseUrl}/diagnostics/socket-info`).pipe(
      catchError(err => {
        console.error('Error fetching socket info via HTTP', err);
        return throwError(() => err);
      })
    );
  }
  // Try connection with alternative namespaces if primary fails
  private tryAlternativeNamespaces(): void {
    console.log('Trying connection with alternative namespaces...');
    
    // Clean up existing socket first
    this.cleanupSocket();
    
    // Move to the next namespace in the list
    if (this.currentNamespaceIndex < this.namespaces.length - 1) {
      this.currentNamespaceIndex++;
      console.log(`Trying next namespace: ${this.namespaces[this.currentNamespaceIndex]}`);
      this.initializeSocketConnection();
    } else {
      // If we've tried all namespaces, reset to the first one for next attempt
      this.currentNamespaceIndex = 0;
      console.error('All namespace attempts failed. Will retry after delay.');
      this.attemptReconnect();
    }
  }
}
