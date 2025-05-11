import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, share, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

/**
 * Browser-compatible Socket.IO wrapper service
 * 
 * This service provides a simplified way to use socket.io-client in the browser without
 * relying on Node.js built-in modules. It's designed to work with the Angular/NX build system.
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserSocketClientService implements OnDestroy {
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
    console.log('BrowserSocketClientService initialized');
  }

  /**
   * Connect to a socket namespace with browser-compatible options
   * @param namespace The namespace to connect to (default: '/')
   * @returns The socket instance
   */
  connect(namespace: string = '/'): Socket {
    // Check for existing socket
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    // Configure transport options to avoid Node.js dependencies
    const options = {
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      forceNew: false,
      reconnectionAttempts: 5,
      timeout: 10000,
      // Avoid upgrading transport which can require Node.js modules
      upgrade: false,
      rememberUpgrade: false
    };
    
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
   */
  emit(eventName: string, data: any, namespace: string = '/'): void {
    const socket = this.getOrCreateSocket(namespace);
    socket.emit(eventName, data);
  }

  /**
   * Get connection status observable for a namespace
   * @param namespace Socket namespace (default: '/')
   * @returns Observable of connection status (true = connected)
   */
  getStatus(namespace: string = '/'): Observable<boolean> {
    // Get or create the connection status
    if (!this.connectionStatus.has(namespace)) {
      this.getOrCreateSocket(namespace);
    }
    
    return this.connectionStatus.get(namespace)!.asObservable();
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
    
    return this.sockets.get(namespace)!.connected;
  }

  /**
   * Disconnect a specific socket
   * @param namespace Socket namespace (default: '/')
   */
  disconnect(namespace: string = '/'): void {
    if (this.sockets.has(namespace)) {
      const socket = this.sockets.get(namespace)!;
      
      socket.disconnect();
      this.sockets.delete(namespace);
      
      if (this.connectionStatus.has(namespace)) {
        this.connectionStatus.get(namespace)!.next(false);
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
   */
  private buildUrl(namespace: string): string {
    const baseUrl = environment.apiUrl || window.location.origin;
    
    // Ensure namespace starts with a /
    if (!namespace.startsWith('/')) {
      namespace = '/' + namespace;
    }
    
    return baseUrl;
  }

  /**
   * Get an existing socket or create a new one
   * @param namespace Socket namespace
   */
  private getOrCreateSocket(namespace: string = '/'): Socket {
    if (!this.sockets.has(namespace)) {
      this.connect(namespace);
    }
    
    return this.sockets.get(namespace)!;
  }

  /**
   * Set up connection status handlers for a socket
   * @param socket Socket instance
   * @param namespace Socket namespace
   */
  private setupConnectionHandlers(socket: Socket, namespace: string): void {
    const statusSubject = this.connectionStatus.get(namespace)!;
    
    socket.on('connect', () => {
      console.log(`Socket connected: ${namespace}`);
      statusSubject.next(true);
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${namespace}`);
      statusSubject.next(false);
    });
    
    socket.on('connect_error', (error: any) => {
      console.error(`Socket connection error (${namespace}):`, error);
      statusSubject.next(false);
    });
  }
}
