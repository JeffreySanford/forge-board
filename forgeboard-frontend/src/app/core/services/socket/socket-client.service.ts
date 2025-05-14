import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, share, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

/**
 * Modern Angular/Nx SocketIO wrapper service
 * This service provides a cleaner way to work with Socket.IO in an Angular application
 */
@Injectable({
  providedIn: 'root'
})
export class SocketClientService implements OnDestroy {
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

  private baseUrl = environment.apiBaseUrl;

  constructor() {
    console.log('SocketClientService initialized');
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

    // Merge default options with user options
    const defaultOpts = {
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: true,
    };
    const options = { ...defaultOpts, ...opts };

    // Create the socket instance
    const socketUrl = environment.apiBaseUrl || '';
    const path = namespace === '/' ? '' : namespace;
    const socket = io(`${socketUrl}${path}`, options);

    // Store the socket
    this.sockets.set(namespace, socket);
    
    // Initialize connection status subject
    if (!this.connectionStatus.has(namespace)) {
      this.connectionStatus.set(namespace, new BehaviorSubject<boolean>(socket.connected));
    }

    // Handle connection events
    fromEvent(socket, 'connect')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log(`Socket connected to namespace: ${namespace}`);
        this.connectionStatus.get(namespace)?.next(true);
      });

    fromEvent(socket, 'disconnect')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log(`Socket disconnected from namespace: ${namespace}`);
        this.connectionStatus.get(namespace)?.next(false);
      });

    fromEvent(socket, 'connect_error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => {
        console.error(`Socket connection error on namespace ${namespace}:`, err);
        this.connectionStatus.get(namespace)?.next(false);
      });

    return socket;
  }

  /**
   * Get a socket by namespace
   * @param namespace The namespace to get (default: '/')
   * @returns The socket instance or undefined if not connected
   */
  getSocket(namespace: string): Socket {
    const socket = this.sockets.get(namespace);
    if (!socket) {
      throw new Error(`Socket for namespace ${namespace} not found`);
    }
    return socket;
  }

  /**
   * Get connection status as an observable
   * @param namespace The namespace to check (default: '/')
   * @returns Observable of connection status (true = connected)
   */  connectionState(namespace: string = '/'): Observable<boolean> {
    if (!this.connectionStatus.has(namespace)) {
      let connected = false;
      if (this.sockets.has(namespace)) {
        const socket = this.sockets.get(namespace);
        if (socket) {
          connected = socket.connected;
        }
      }
      this.connectionStatus.set(namespace, new BehaviorSubject<boolean>(connected));
    }
    
    const connectionStatus = this.connectionStatus.get(namespace);
    return connectionStatus ? connectionStatus.asObservable() : new BehaviorSubject<boolean>(false).asObservable();
  }

  /**
   * Listen for events from the server
   * @param eventName The event name to listen for
   * @param namespace The namespace to listen on (default: '/')
   * @returns Observable that emits event data
   */
  listen<T>(eventName: string, namespace: string = '/'): Observable<T> {
    // Get or create socket for namespace
    const socket = this.sockets.get(namespace) || this.connect(namespace);
    
    // Create observable for event
    return new Observable<T>(observer => {
      socket.on(eventName, (data: T) => {
        observer.next(data);
      });
      
      // Return teardown logic
      return () => {
        socket.off(eventName);
      };
    }).pipe(
      // Share the observable to prevent multiple subscriptions
      share()
    );
  }

  /**
   * Send an event to the server
   * @param eventName The event name to emit
   * @param data The data to send
   * @param namespace The namespace to emit to (default: '/')
   * @param callback Optional callback for acknowledgements
   */
  emit(eventName: string, data: unknown, namespace: string = '/', callback?: (response: unknown) => void): void {
    // Get or create socket for namespace
    const socket = this.sockets.get(namespace) || this.connect(namespace);
    
    // Emit the event
    if (callback) {
      socket.emit(eventName, data, callback);
    } else {
      socket.emit(eventName, data);
    }
  }

  /**
   * Disconnect a specific socket by namespace
   * @param namespace The namespace to disconnect (default: '/')
   */
  disconnect(namespace: string = '/'): void {
    const socket = this.sockets.get(namespace);
    
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
      this.connectionStatus.get(namespace)?.next(false);
    }
  }

  /**
   * Disconnect a specific socket by namespace
   * @param namespace The namespace to disconnect (default: '/')
   */
  disconnectSocket(namespace: string): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      try {
        socket.disconnect();
        this.sockets.delete(namespace);
        console.log(`Socket ${namespace} disconnected and removed`);
      } catch (error) {
        console.error(`Error disconnecting socket ${namespace}:`, error);
      }
    }
  }

  /**
   * Disconnect all sockets
   */
  disconnectAll(): void {
    for (const [namespace, socket] of this.sockets.entries()) {
      if (socket) {
        try {
          socket.disconnect();
        } catch (error) {
          console.error(`Error disconnecting socket ${namespace}:`, error);
        }
      }
    }
    this.sockets.clear();
    console.log('All sockets disconnected');
  }

  /**
   * Clean up resources on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectAll();
  }
}
