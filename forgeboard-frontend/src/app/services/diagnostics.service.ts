import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, timer, throwError } from 'rxjs'; // Removed EMPTY, of, switchMap, tap, retryWhen, delayWhen
import { catchError, takeUntil } from 'rxjs/operators'; // Removed switchMap, tap, retryWhen, delayWhen from here too if they were mistakenly duplicated
import { io, Socket } from 'socket.io-client';

import { BackendStatusService, BackendStatusSummary } from './backend-status.service'; // Added BackendStatusSummary
import { TypeDiagnosticsService } from './type-diagnostics.service';

import {
  HealthData,
  // SocketInfo, // Removed unused import
  SocketLogEvent,
  // SocketMetrics, // Removed unused import
  SocketStatusUpdate,
  MetricData,
  HealthTimelinePoint // Added HealthTimelinePoint
} from '@forge-board/shared/api-interfaces';

// Define a generic SocketResponse type if createSocketResponse is used on backend
interface SocketResponse<T> {
  type: string;
  payload: T;
  timestamp: string;
  success: boolean;
}

// Extended health data type
export interface EnhancedHealthData extends HealthData {
  clientProcessedTimestamp?: string;
  isSimulated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService implements OnDestroy {
  private socket!: Socket; // Added definite assignment assertion
  // TODO: Use environment variables for API_URL and DIAGNOSTICS_NAMESPACE
  private readonly API_URL = 'http://localhost:3333'; // Adjusted to base URL
  private readonly DIAGNOSTICS_NAMESPACE = '/diagnostics';

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

  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService,
    private typeDiagnostics: TypeDiagnosticsService
  ) {
    this.initializeSocketConnection();

    // Monitor backend status for reconnection
    this.backendStatusService.getStatusSummary().pipe( // Changed to getStatusSummary()
      takeUntil(this.destroy$)
    ).subscribe((status: BackendStatusSummary) => { // Explicitly typed status
      if (status.allConnected && (!this.socket || !this.socket.connected)) { // Used status.allConnected
        this.attemptReconnect();
      }
    });
  }

  private initializeSocketConnection(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }

    const socketUrl = `${this.API_URL}${this.DIAGNOSTICS_NAMESPACE}`;
    
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: false, // Disable automatic reconnection to manage it manually
    });

    this.connectionStatusSubject.next(false);

    this.socket.on('connect', () => {
      this.connectionStatusSubject.next(true);
      this.currentReconnectAttempt = 0; // Reset reconnect attempts on successful connection
      console.log('Connected to diagnostics socket namespace.');
      this.setupSocketEventHandlers();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatusSubject.next(false);
      console.log(`Disconnected from diagnostics socket: ${reason}`);
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
        // Attempt to reconnect if not a manual disconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionStatusSubject.next(false);
      console.error('Diagnostics socket connection error:', error);
      this.attemptReconnect(); // Attempt to reconnect on connection error
    });
  }
  
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Refined handleResponse function
    const handleResponse = <T>(eventData: SocketResponse<T> | T, subject: BehaviorSubject<T | null>) => {
      const payload = (eventData && typeof eventData === 'object' && 'payload' in eventData)
        ? (eventData as SocketResponse<T>).payload
        : eventData;
      subject.next(payload as T | null); // Ensure payload can be null if T allows null
    };

    this.socket.on('health-update', (data: SocketResponse<HealthData> | HealthData) => {
      const payload = (data && typeof data === 'object' && 'payload' in data) ? (data as SocketResponse<HealthData>).payload : data;
      if (payload) {
        const enhancedData: EnhancedHealthData = {
          ...(payload as HealthData),
          clientProcessedTimestamp: new Date().toISOString()
        };
        this.healthUpdatesSubject.next(enhancedData);
      }
    });

    this.socket.on('socket-status', (data: SocketResponse<SocketStatusUpdate> | SocketStatusUpdate) => {
       handleResponse<SocketStatusUpdate>(data, this.socketStatusSubject);
    });    this.socket.on('socket-logs', (data: SocketResponse<SocketLogEvent[]> | SocketLogEvent[]) => {
      // Handle socket logs directly without using handleResponse to avoid type casting
      const payload = (data && typeof data === 'object' && 'payload' in data)
        ? (data as SocketResponse<SocketLogEvent[]>).payload
        : data;
      
      this.socketLogsSubject.next(payload as SocketLogEvent[]);
    });this.socket.on('live-metric-update', (data: SocketResponse<MetricData> | MetricData) => {
      handleResponse<MetricData>(data, this.liveMetricsSubject);
    });

    // Listen for timeline updates
    this.socket.on('timeline-update', (data: SocketResponse<HealthTimelinePoint[]> | HealthTimelinePoint[]) => {
      // We don't need to cast here since timelinePointsSubject is already a BehaviorSubject<HealthTimelinePoint[]>
      const payload = (data && typeof data === 'object' && 'payload' in data)
        ? (data as SocketResponse<HealthTimelinePoint[]>).payload
        : data;
      
      this.timelinePointsSubject.next(payload as HealthTimelinePoint[]);
    });

    // Request initial data upon connection (optional, if backend sends it)
    this.socket.emit('request-initial-timeline');
  }

  private attemptReconnect(): void {
    if (this.currentReconnectAttempt < this.maxReconnectAttempts && (!this.socket || !this.socket.connected)) {
      this.currentReconnectAttempt++;
      console.log(`Attempting to reconnect to diagnostics socket... (Attempt ${this.currentReconnectAttempt}/${this.maxReconnectAttempts})`);
      // Use a timer for delay before retrying connection
      timer(3000 * this.currentReconnectAttempt) // Exponential backoff or fixed delay
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.socket) {
      this.socket.disconnect();
    }
    this.healthUpdatesSubject.complete();
    this.socketStatusSubject.complete();
    this.socketLogsSubject.complete();
    this.liveMetricsSubject.complete(); // Added
    this.timelinePointsSubject.complete(); // Complete the new subject
    this.connectionStatusSubject.complete();
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
    return this.http.get<HealthData>(`${this.API_URL}/api/diagnostics/health`).pipe(
      catchError(err => {
        console.error('Error fetching health data via HTTP', err);
        return throwError(() => err);
      })
    );
  }
  
  public getSocketInfo(): Observable<SocketStatusUpdate> { // Assuming this maps to a real endpoint
    return this.http.get<SocketStatusUpdate>(`${this.API_URL}/api/diagnostics/socket-info`).pipe(
      catchError(err => {
        console.error('Error fetching socket info via HTTP', err);
        return throwError(() => err);
      })
    );
  }
}
