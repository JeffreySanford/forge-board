import { Injectable, OnDestroy } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BackendStatusService } from '../monitoring/backend-status.service';

/**
 * Browser-specific Socket service implementation
 * 
 * This service handles Socket.IO connections in browser environments,
 * with features like automatic reconnection and connection status tracking.
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserSocketService implements OnDestroy {
  private sockets = new Map<string, Socket>();
  private connectionStatus = new Map<string, BehaviorSubject<boolean>>();
  private destroy$ = new Subject<void>();
  
  private readonly socketUrl = environment.socketBaseUrl || 'http://localhost:3000';

  constructor(private backendStatusService: BackendStatusService) {}

  /**
   * Connect to a specific namespace
   * @param namespace The socket namespace to connect to
   * @returns Socket instance
   */
  connect(namespace: string): Socket {
    // Normalize namespace format
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    // Return existing socket if already connected
    if (this.sockets.has(normalizedNamespace)) {
      return this.sockets.get(normalizedNamespace)!;
    }
    
    // Create socket connection
    const socket = io(`${this.socketUrl}${normalizedNamespace}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Create status subject if not exists
    if (!this.connectionStatus.has(normalizedNamespace)) {
      this.connectionStatus.set(normalizedNamespace, new BehaviorSubject<boolean>(false));
    }
    
    const statusSubject = this.connectionStatus.get(normalizedNamespace)!;
    
    // Setup event listeners
    socket.on('connect', () => {
      console.log(`Socket connected to ${normalizedNamespace}`);
      statusSubject.next(true);
      this.backendStatusService.updateGatewayStatus(namespace, true, false);
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected from ${normalizedNamespace}`);
      statusSubject.next(false);
      this.backendStatusService.updateGatewayStatus(namespace, false, false);
    });
    
    socket.on('connect_error', (error) => {
      console.error(`Socket connection error for ${normalizedNamespace}:`, error);
      statusSubject.next(false);
      this.backendStatusService.updateGatewayStatus(namespace, false, true);
    });
    
    // Store socket
    this.sockets.set(normalizedNamespace, socket);
    
    return socket;
  }

  /**
   * Disconnect from a specific namespace
   * @param namespace The socket namespace to disconnect from
   */
  disconnect(namespace: string): void {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    if (this.sockets.has(normalizedNamespace)) {
      const socket = this.sockets.get(normalizedNamespace)!;
      
      // Remove all listeners
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
   * Clean up resources on service destruction
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Disconnect all sockets
    this.sockets.forEach((socket, namespace) => {
      console.log(`Cleaning up socket for ${namespace}`);
      
      // Remove all listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      
      if (socket.connected) {
        socket.disconnect();
      }
    });
    
    // Clear maps
    this.sockets.clear();
    
    // Complete all subjects
    this.connectionStatus.forEach(subject => {
      subject.complete();
    });
    this.connectionStatus.clear();
  }
}