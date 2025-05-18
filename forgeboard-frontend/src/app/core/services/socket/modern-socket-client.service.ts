import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketClientService } from './socket-client.service';
import { environment } from '../../../../environments/environment';

/**
 * Modern implementation of the SocketClientService with enhanced features
 * For environments that support advanced browser APIs
 */
@Injectable({
  providedIn: 'root'
})
export class ModernSocketClientService implements SocketClientService {
  private sockets = new Map<string, Socket>();
  private connectionStatus = new Map<string, BehaviorSubject<boolean>>();
  private readonly socketUrl = environment.socketBaseUrl || 'http://localhost:3000';

  constructor() {}

  /**
   * Connect to a specific namespace
   * @param namespace The namespace to connect to
   * @returns Socket connection
   */
  connect(namespace: string): Socket {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    // Return existing socket if already connected
    if (this.sockets.has(normalizedNamespace)) {
      return this.sockets.get(normalizedNamespace)!;
    }
    
    // Create socket connection with enhanced options
    const socket = io(`${this.socketUrl}${normalizedNamespace}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true,
      auth: {
        token: this.getAuthToken()
      }
    });
    
    // Set up status tracking
    if (!this.connectionStatus.has(normalizedNamespace)) {
      this.connectionStatus.set(normalizedNamespace, new BehaviorSubject<boolean>(false));
    }
    
    const statusSubject = this.connectionStatus.get(normalizedNamespace)!;
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log(`ModernSocketClient: Connected to ${normalizedNamespace}`);
      statusSubject.next(true);
      
      // Use BroadcastChannel API for cross-tab communication
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('socket-status');
          bc.postMessage({ namespace: normalizedNamespace, status: 'connected' });
          bc.close();
        } catch (e) {
          console.warn('Failed to use BroadcastChannel', e);
        }
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`ModernSocketClient: Disconnected from ${normalizedNamespace}`);
      statusSubject.next(false);
    });
    
    // Store socket
    this.sockets.set(normalizedNamespace, socket);
    
    return socket;
  }

  /**
   * Disconnect from a specific namespace
   * @param namespace The namespace to disconnect from
   */
  disconnect(namespace: string): void {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    if (this.sockets.has(normalizedNamespace)) {
      const socket = this.sockets.get(normalizedNamespace)!;
      
      // Clean up event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      
      // Disconnect socket
      if (socket.connected) {
        socket.disconnect();
      }
      
      // Update status
      const statusSubject = this.connectionStatus.get(normalizedNamespace);
      if (statusSubject) {
        statusSubject.next(false);
      }
      
      // Remove from maps
      this.sockets.delete(normalizedNamespace);
    }
  }

  /**
   * Get connection status for a namespace
   * @param namespace The socket namespace
   * @returns Observable of connection status
   */
  getConnectionStatus(namespace: string): Observable<boolean> {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    if (!this.connectionStatus.has(normalizedNamespace)) {
      this.connectionStatus.set(normalizedNamespace, new BehaviorSubject<boolean>(false));
    }
    
    return this.connectionStatus.get(normalizedNamespace)!.asObservable();
  }

  /**
   * Get socket instance for a namespace
   * @param namespace The socket namespace
   * @returns Socket instance or null
   */
  getSocket(namespace: string): Socket | null {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    return this.sockets.get(normalizedNamespace) || null;
  }

  /**
   * Get authentication token for socket connections
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}
