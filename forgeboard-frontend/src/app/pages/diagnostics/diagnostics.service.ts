import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

// Define proper interfaces
interface Health {
  status: string;
  uptime: number;
  details: {
    past: string;
    present: string;
    future: string;
    [key: string]: string;
  };
}

interface ServicesData {
  services: string[];
  controllers: string[];
  gateways: string[];
}

interface EventResponse {
  success: boolean;
  message?: string;
}

interface MetricData {
  cpu: number;
  memory: number;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService implements OnDestroy {
  private apiUrl = 'http://localhost:3000/api/diagnostics';
  private socket: Socket | null = null;
  private connectionStatusSubject = new Subject<'connected' | 'disconnected' | 'error'>();
  
  constructor(private http: HttpClient) {
    this.initSocket();
  }

  ngOnDestroy(): void {
    // Clean up socket connection
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Complete any subjects if they exist
    // Add any other cleanup needed
  }

  getServicesAndControllers(): Observable<ServicesData> {
    return this.http.get<ServicesData>(`${this.apiUrl}/services`).pipe(
      catchError(() => of({ services: [], controllers: [], gateways: [] }))
    );
  }

  getHealth(): Observable<Health> {
    return this.http.get<Health>(`${this.apiUrl}/health`).pipe(
      catchError(() => of({
        status: 'Unknown',
        uptime: 0,
        details: {
          past: 'Connection Error',
          present: 'Unable to connect to API',
          future: 'Try again later'
        }
      }))
    );
  }

  registerEvent(event: string): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/event`, { event }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  healthUpdates(): Observable<Health> {
    // Implementation for real-time health updates via socket connection
    return new Observable<Health>(observer => {
      if (!this.socket) {
        observer.error(new Error('Socket not initialized'));
        return;
      }
      
      this.socket.on('health-update', (response: SocketResponse<Health>) => {
        if (response.status === 'success') {
          observer.next(response.data);
        } else {
          observer.error(new Error(response.data.toString()));
        }
      });
      
      return () => {
        this.socket?.off('health-update');
      };
    });
  }
  
  getMetricsUpdates(): Observable<SocketResponse<MetricData>> {
    return new Observable<SocketResponse<MetricData>>(observer => {
      if (!this.socket) {
        observer.error(new Error('Socket not initialized'));
        return;
      }
      
      this.socket.on('system-metrics', (response: SocketResponse<MetricData>) => {
        observer.next(response);
      });
      
      return () => {
        this.socket?.off('system-metrics');
      };
    });
  }
  
  connectionStatus(): Observable<'connected' | 'disconnected' | 'error'> {
    return this.connectionStatusSubject.asObservable();
  }

  // Add a method to disconnect all sockets
  disconnectAll(): void {
    // Clean up socket connection
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Complete the connection status subject
    this.connectionStatusSubject.complete();
  }

  private initSocket() {
    try {
      this.socket = io('http://localhost:3000');
      
      this.socket.on('connect', () => {
        this.connectionStatusSubject.next('connected');
      });
      
      this.socket.on('disconnect', () => {
        this.connectionStatusSubject.next('disconnected');
      });
      
      this.socket.on('connect_error', () => {
        this.connectionStatusSubject.next('error');
      });
      
    } catch (error) {
      console.error('Socket connection error:', error);
      this.connectionStatusSubject.next('error');
    }
  }
}
