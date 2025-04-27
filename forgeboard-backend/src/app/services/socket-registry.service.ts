import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class SocketRegistryService<TData = unknown> {
  private readonly logger = new Logger(SocketRegistryService.name);
  
  /** Map of active socket connections */
  private readonly sockets = new Map<string, Socket>();
  
  /** Map of socket info */
  private readonly socketInfo = new Map<string, any>();
  
  /** Map of subscriptions */
  private readonly subscriptions = new Map<string, any>();
  
  // Metrics tracking
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
  };

  // Event streams
  private readonly statusUpdate$ = new BehaviorSubject<any>({
    activeSockets: [],
    metrics: this.metrics
  });
  
  /**
   * Register a socket with the registry
   */
  registerSocket(socket: Socket, initialData?: TData): string {
    this.logger.debug(`Registering socket: ${socket.id}`);
    
    // Store socket
    this.sockets.set(socket.id, socket);
    
    // Update metrics
    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.sockets.size;
    
    return socket.id;
  }
  
  /**
   * Unregister and disconnect a socket
   */
  unregisterSocket(socketId: string, reason = 'manual-unregister'): void {
    const socket = this.sockets.get(socketId);
    
    if (!socket) {
      this.logger.warn(`Attempted to unregister unknown socket: ${socketId}`);
      return;
    }
    
    this.logger.debug(`Unregistering socket: ${socketId}, reason: ${reason}`);
    
    // Clean up socket
    if (socket.connected) {
      socket.disconnect(true);
    }
    this.sockets.delete(socketId);
    
    // Update metrics
    this.metrics.disconnections++;
    this.metrics.activeConnections = this.sockets.size;
  }
  
  /**
   * Get all active sockets
   */
  getActiveSockets(): any[] {
    return Array.from(this.socketInfo.values())
      .filter(info => !info.disconnectTime);
  }
  
  /**
   * Observe status updates
   */
  statusUpdates(): Observable<any> {
    return this.statusUpdate$.asObservable();
  }
}
