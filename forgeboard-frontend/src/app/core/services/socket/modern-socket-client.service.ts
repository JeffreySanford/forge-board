import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, share, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

/**
 * Modern Angular/Nx SocketIO wrapper service with improved browser compatibility
 * This service provides a cleaner way to work with Socket.IO in an Angular application
 * and handles browser compatibility issues with Node.js built-ins
 */
@Injectable({
  providedIn: 'root'
})
export class ModernSocketClientService implements OnDestroy {
  /**
   * Map of active socket connections by namespace
   */
  private sockets: Map<string, Socket> = new Map();
  
  /**
   * Connection status by namespace
   */
  private connectionStatus: Map<string, BehaviorSubject<boolean>> = new Map();
  
  /**
   * Destroy subject for cleaning up subscriptions
   */
  private destroy$ = new Subject<void>();

  constructor() {
    console.log('ModernSocketClientService initialized');
  }

  /**
   * Connect to a socket namespace
   * @param namespace The namespace to connect to (default: '/')
   * @param opts Socket.IO connection options
   * @returns The socket instance
   */  connect(namespace: string = '/', opts: Record<string, unknown> = {}): Socket {
    // Check for existing socket
    if (this.sockets.has(namespace)) {
      const socket = this.sockets.get(namespace);
      if (socket) return socket;
    }

    // Configure browser-friendly transport options
    // This helps avoid Node.js modules like http, fs, etc.
    const defaultOpts = {
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      forceNew: false,
      reconnectionAttempts: 5,
      timeout: 10000,
      // These options help with browser compatibility
      upgrade: false,
      rememberUpgrade: false
    };
    
    const options = { ...defaultOpts, ...opts };
    
    // Create URL including namespace
    const url = this.buildUrl(namespace);
    
    try {
      // Create socket with browser-compatible options
      const socket = io(url, options);

      // Store socket instance
      this.sockets.set(namespace, socket);
      
      // Initialize connection status
      if (!this.connectionStatus.has(namespace)) {
        this.connectionStatus.set(namespace, new BehaviorSubject<boolean>(false));
      }
      
      // Update connection status on connect/disconnect events
      this.setupConnectionHandlers(socket, namespace);
      
      return socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  /**
   * Listen to an event on a specific namespace
   * @param eventName Event to listen for
   * @param namespace Socket namespace (default: '/')
   * @returns Observable of event data
   */
  fromEvent<T>(eventName: string, namespace: string = '/'): Observable<T> {
    // Get or create socket for this namespace
    const socket = this.getOrCreateSocket(namespace);
    
    // Create observable from socket event
    return fromEvent<T>(socket, eventName).pipe(
      takeUntil(this.destroy$),
      share() // Share the observable between multiple subscribers
    );
  }

  /**
   * Emit an event to a specific namespace
   * @param eventName Event name to emit
   * @param data Data to send
   * @param namespace Socket namespace (default: '/')
   */  emit(eventName: string, data: unknown, namespace: string = '/'): void {
    const socket = this.getOrCreateSocket(namespace);
    socket.emit(eventName, data);
  }

  /**
   * Get connection status observable for a namespace
   * @param namespace Socket namespace (default: '/')
   * @returns Observable of connection status (true = connected)
   */  getStatus(namespace: string = '/'): Observable<boolean> {
    // Get or create the connection status
    if (!this.connectionStatus.has(namespace)) {
      this.getOrCreateSocket(namespace);
    }
    
    const connectionStatus = this.connectionStatus.get(namespace);
    return connectionStatus ? connectionStatus.asObservable() : new BehaviorSubject<boolean>(false).asObservable();
  }

  /**
   * Check if a socket is connected
   * @param namespace Socket namespace (default: '/')
   * @returns True if connected
   */
  isConnected(namespace: string = '/'): boolean {
    if (!this.sockets.has(namespace)) {
      return false;
    }
    
    const socket = this.sockets.get(namespace);
    return socket ? socket.connected : false;
  }

  /**
   * Disconnect a specific socket
   * @param namespace Socket namespace (default: '/')
   */  disconnect(namespace: string = '/'): void {
    if (this.sockets.has(namespace)) {
      const socket = this.sockets.get(namespace);
      if (socket) {
        socket.disconnect();
        this.sockets.delete(namespace);
        
        if (this.connectionStatus.has(namespace)) {
          const connectionStatus = this.connectionStatus.get(namespace);
          if (connectionStatus) {
            connectionStatus.next(false);
          }
        }
      }
    }
  }

  /**
   * Disconnect all sockets
   */
  disconnectAll(): void {
    this.sockets.forEach((socket, namespace) => {
      this.disconnect(namespace);
    });
  }

  /**
   * Clean up resources on service destruction
   */
  ngOnDestroy(): void {
    this.disconnectAll();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Build the socket URL with namespace
   */  private buildUrl(namespace: string): string {
    const baseUrl = environment.apiBaseUrl || window.location.origin;
    
    // Ensure namespace starts with a /
    if (!namespace.startsWith('/')) {
      namespace = '/' + namespace;
    }
    
    // Return the complete URL with namespace appended
    return `${baseUrl}${namespace}`;
  }

  /**
   * Get an existing socket or create a new one
   * @param namespace Socket namespace
   */  private getOrCreateSocket(namespace: string = '/'): Socket {
    if (!this.sockets.has(namespace)) {
      this.connect(namespace);
    }
    
    const socket = this.sockets.get(namespace);
    if (!socket) {
      // If for some reason the socket wasn't created, create it now
      return this.connect(namespace);
    }
    return socket;
  }

  /**
   * Set up connection status handlers for a socket
   * @param socket Socket instance
   * @param namespace Socket namespace
   */  private setupConnectionHandlers(socket: Socket, namespace: string): void {
    const statusSubject = this.connectionStatus.get(namespace);
    if (!statusSubject) {
      console.error(`No status subject found for namespace: ${namespace}`);
      return;
    }
    
    socket.on('connect', () => {
      console.log(`Socket connected: ${namespace}`);
      statusSubject.next(true);
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${namespace}`);
      statusSubject.next(false);
    });
    
    socket.on('connect_error', (error: Error | unknown) => {
      console.error(`Socket connection error (${namespace}):`, error);
      statusSubject.next(false);
    });
  }
}
