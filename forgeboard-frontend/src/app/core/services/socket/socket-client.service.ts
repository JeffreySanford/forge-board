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
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    // Check for existing socket
    if (this.sockets.has(formattedNamespace)) {
      const socket = this.sockets.get(formattedNamespace);
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
    const socket = io(`${socketUrl}${formattedNamespace}`, options);

    // Store the socket
    this.sockets.set(formattedNamespace, socket);
      // Initialize connection status subject
    if (!this.connectionStatus.has(formattedNamespace)) {
      this.connectionStatus.set(formattedNamespace, new BehaviorSubject<boolean>(socket.connected));
    }

    // Handle connection events
    fromEvent(socket, 'connect')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log(`Socket connected to namespace: ${formattedNamespace}`);
        this.connectionStatus.get(formattedNamespace)?.next(true);
      });

    fromEvent(socket, 'disconnect')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log(`Socket disconnected from namespace: ${formattedNamespace}`);
        this.connectionStatus.get(formattedNamespace)?.next(false);
      });    fromEvent(socket, 'connect_error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => {
        console.error(`Socket connection error on namespace ${formattedNamespace}:`, err);
        console.info(`Connection details: URL=${socketUrl}${formattedNamespace}, path=${options.path}`);
        this.connectionStatus.get(formattedNamespace)?.next(false);
      });

    return socket;
  }

  /**
   * Get a socket by namespace
   * @param namespace The namespace to get (default: '/')
   * @returns The socket instance or undefined if not connected
   */  getSocket(namespace: string): Socket {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    const socket = this.sockets.get(formattedNamespace);
    if (!socket) {
      throw new Error(`Socket for namespace ${formattedNamespace} not found`);
    }
    return socket;
  }

  /**
   * Get connection status as an observable
   * @param namespace The namespace to check (default: '/')
   * @returns Observable of connection status (true = connected)
   */  connectionState(namespace: string = '/'): Observable<boolean> {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    if (!this.connectionStatus.has(formattedNamespace)) {
      let connected = false;
      if (this.sockets.has(formattedNamespace)) {
        const socket = this.sockets.get(formattedNamespace);
        if (socket) {
          connected = socket.connected;
        }
      }
      this.connectionStatus.set(formattedNamespace, new BehaviorSubject<boolean>(connected));
    }
    
    const connectionStatus = this.connectionStatus.get(formattedNamespace);
    return connectionStatus ? connectionStatus.asObservable() : new BehaviorSubject<boolean>(false).asObservable();
  }

  /**
   * Listen for events from the server
   * @param eventName The event name to listen for
   * @param namespace The namespace to listen on (default: '/')
   * @returns Observable that emits event data
   */  listen<T>(eventName: string, namespace: string = '/'): Observable<T> {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    // Get or create socket for namespace
    const socket = this.sockets.get(formattedNamespace) || this.connect(formattedNamespace);
    
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
   */  emit(eventName: string, data: unknown, namespace: string = '/', callback?: (response: unknown) => void): void {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    // Get or create socket for namespace
    const socket = this.sockets.get(formattedNamespace) || this.connect(formattedNamespace);
    
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
   */  disconnect(namespace: string = '/'): void {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    const socket = this.sockets.get(formattedNamespace);
    
    if (socket) {
      socket.disconnect();
      this.sockets.delete(formattedNamespace);
      this.connectionStatus.get(formattedNamespace)?.next(false);
    }
  }

  /**
   * Disconnect a specific socket by namespace
   * @param namespace The namespace to disconnect (default: '/')
   */  disconnectSocket(namespace: string): void {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    const socket = this.sockets.get(formattedNamespace);
    if (socket) {
      try {
        socket.disconnect();
        this.sockets.delete(formattedNamespace);
        console.log(`Socket ${formattedNamespace} disconnected and removed`);
      } catch (error) {
        console.error(`Error disconnecting socket ${formattedNamespace}:`, error);
      }
    }
  }

  /**
   * Disconnect all sockets
   */  disconnectAll(): void {
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
   * Attempt to reconnect a specific socket namespace
   * @param namespace The namespace to reconnect
   * @returns Observable that emits true if reconnected successfully
   */  reconnect(namespace: string): Observable<boolean> {
    // Format namespace properly with leading slash
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    
    const reconnectSubject = new BehaviorSubject<boolean>(false);
    
    // Get the existing socket or create a new one
    let socket = this.sockets.get(formattedNamespace);
    
    if (socket) {
      console.log(`Attempting to reconnect namespace: ${formattedNamespace}`);
      
      // Try to connect if not already connected
      if (!socket.connected) {
        socket.connect();
        
        // Set up a one-time connect event
        socket.once('connect', () => {
          console.log(`Successfully reconnected to namespace: ${formattedNamespace}`);
          reconnectSubject.next(true);
          reconnectSubject.complete();
        });
        
        // Set up a one-time error event
        socket.once('connect_error', (err) => {
          console.error(`Failed to reconnect to namespace: ${formattedNamespace}`, err);
          reconnectSubject.next(false);
          reconnectSubject.complete();
        });
      } else {
        // Already connected
        reconnectSubject.next(true);
        reconnectSubject.complete();
      }
    } else {
      // No existing socket, try creating a new one
      try {
        socket = this.connect(formattedNamespace);
        socket.once('connect', () => {
          reconnectSubject.next(true);
          reconnectSubject.complete();
        });
        
        socket.once('connect_error', (err) => {
          console.error(`Failed to connect to namespace: ${formattedNamespace}`, err);
          reconnectSubject.next(false);
          reconnectSubject.complete();
        });
      } catch (error) {
        console.error(`Error creating socket for namespace: ${formattedNamespace}`, error);
        reconnectSubject.next(false);
        reconnectSubject.complete();
      }
    }
    
    return reconnectSubject.asObservable();
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
