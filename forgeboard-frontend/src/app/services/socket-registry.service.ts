import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { SocketInfo, SocketStatusUpdate } from '@forge-board/shared/api-interfaces';
import { catchError, map, retry } from 'rxjs/operators';

interface SocketConnection {
  namespace: string;
  socket: Socket;
  connected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocketRegistryService {
  private sockets: Map<string, SocketConnection> = new Map();
  private socketsSubject = new BehaviorSubject<SocketConnection[]>([]);
  // Fix: Update API URL to use the correct path
  private apiUrl = '/api'; // Base API URL

  constructor(private http: HttpClient) {
    console.log('Socket Registry Service initialized');
  }

  /**
   * Register a socket connection
   */
  registerSocket(namespace: string, socket: Socket): void {
    this.sockets.set(namespace, {
      namespace,
      socket,
      connected: socket.connected
    });
    this.updateSocketsSubject();
  }

  /**
   * Get a socket by namespace
   */
  getSocket(namespace: string): Socket | undefined {
    return this.sockets.get(namespace)?.socket;
  }

  /**
   * Get all registered sockets
   */
  getSockets(): BehaviorSubject<SocketConnection[]> {
    return this.socketsSubject;
  }

  /**
   * Disconnect all sockets except the specified namespace
   */
  disconnectAllExcept(exceptNamespace: string): void {
    console.log(`Disconnecting all sockets except: ${exceptNamespace}`);
    
    for (const [namespace, connection] of this.sockets.entries()) {
      if (namespace !== exceptNamespace && connection.socket.connected) {
        console.log(`Disconnecting socket: ${namespace}`);
        connection.socket.disconnect();
        connection.connected = false;
      }
    }
    
    this.updateSocketsSubject();
  }

  /**
   * Fetches all active sockets from the backend.
   */
  getBackendActiveSockets(): Observable<SocketInfo[]> {
    // Fix: Update the API path to match the backend controller
    return this.http.get<SocketInfo[] | { activeSockets?: SocketInfo[] } | { data?: SocketInfo[] }>(`${this.apiUrl}/sockets/active`)
      .pipe(
        retry(1),
        map(response => {
          // Log the raw response for debugging
          console.log('Raw socket response:', response);
          
          // Handle various response formats
          if (Array.isArray(response)) {
            return response;
          } else if (response && typeof response === 'object') {
            if ('activeSockets' in response && Array.isArray(response.activeSockets)) {
              return response.activeSockets;
            } else if ('data' in response && Array.isArray(response.data)) {
              return response.data;
            }
          }
          
          // If we can't determine the format, return an empty array
          console.warn('Unknown response format from socket API:', response);
          return [];
        }),
        catchError(error => {
          console.error('Error fetching active sockets:', error);
          // Return an empty array instead of throwing to prevent UI errors
          return throwError(() => new Error('Failed to load socket information'));
        })
      );
  }

  /**
   * Update the sockets BehaviorSubject
   */
  private updateSocketsSubject(): void {
    const socketsList = Array.from(this.sockets.values());
    this.socketsSubject.next(socketsList);
  }
}
