import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { SocketInfo } from '@forge-board/shared/api-interfaces'; // Import SocketInfo

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
  private apiUrl = '/api/sockets'; // Define the API URL

  constructor(private http: HttpClient) { // Inject HttpClient
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
    return this.http.get<SocketInfo[]>(`${this.apiUrl}/active`);
  }

  /**
   * Update the sockets BehaviorSubject
   */
  private updateSocketsSubject(): void {
    const socketsList = Array.from(this.sockets.values());
    this.socketsSubject.next(socketsList);
  }
}
