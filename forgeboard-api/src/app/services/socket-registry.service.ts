import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketInfo, SocketMetrics, SocketStatusUpdate, DiagnosticSocketEvent } from '@forge-board/shared/api-interfaces';
import { BehaviorSubject, Observable, Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, tap, share } from 'rxjs/operators';

/**
 * SocketRegistryService
 *
 * Manages the lifecycle of WebSocket connections and their associated RxJS subscriptions.
 * Provides observables for socket events, metrics, and status updates.
 *
 * Features:
 * - Track socket connections with metadata
 * - Monitor socket events (connect, disconnect, messages)
 * - Gather socket metrics (counts, errors)
 * - Provide reactive streams of socket activity
 * - Auto-cleanup resources on service destruction
 */
@Injectable()
export class SocketRegistryService<TData = unknown> implements OnModuleDestroy {
  private readonly logger = new Logger(SocketRegistryService.name);
  
  /** Map of active socket connections */
  private readonly sockets = new Map<string, Socket>();
  
  /** Map of socket metadata and event history */
  private readonly socketInfo = new Map<string, SocketInfo<TData>>();
  
  /** Map of per-socket RxJS subscriptions */
  private readonly subscriptions = new Map<string, Subscription>();
  
  /** Signal for completing all observables on destroy */
  private readonly destroy$ = new Subject<void>();
  
  // Metrics tracking
  private metrics: SocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
  };

  // Event streams
  private readonly socketEvent$ = new BehaviorSubject<{ socketId: string; event: string; data?: TData }>(
    { socketId: 'system', event: 'init' }
  );
  private readonly socketError$ = new Subject<{ socketId: string; error: unknown }>();
  private readonly socketConnect$ = new Subject<{ socketId: string; socket: Socket }>();
  private readonly socketDisconnect$ = new Subject<{ socketId: string }>();
  private readonly metricsUpdate$ = new BehaviorSubject<SocketMetrics>(this.metrics);
  private readonly statusUpdate$ = new BehaviorSubject<SocketStatusUpdate<TData>>({
    activeSockets: [],
    metrics: this.metrics
  });
  
  /**
   * Register a socket with the registry
   *
   * @param socket The socket.io Socket instance to register
   * @param initialData Optional initial data to associate with this socket
   * @returns The generated socket ID
   */
  registerSocket(socket: Socket, initialData?: TData): string {
    this.logger.debug(`Registering socket: ${socket.id}`);
    
    // Create socket info record
    const socketInfo: SocketInfo<TData> = {
      id: socket.id,
      namespace: socket.nsp.name,
      clientIp: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
      connectTime: new Date(),
      lastActivity: new Date(),
      events: [
        { type: 'connect', timestamp: new Date(), data: initialData }
      ]
    };
    
    // Store socket and info
    this.sockets.set(socket.id, socket);
    this.socketInfo.set(socket.id, socketInfo);
    
    // Update metrics
    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.sockets.size;
    this.emitMetricsUpdate();
    
    // Create observable streams from socket events
    const disconnect$ = fromEvent(socket, 'disconnect').pipe(
      tap(() => this.handleDisconnect(socket.id)),
      takeUntil(this.destroy$)
    );
    
    const error$ = fromEvent(socket, 'error').pipe(
      tap((err) => this.handleError(socket.id, err)),
      takeUntil(this.destroy$)
    );
    
    // Create a single subscription for all socket events
    const subscription = merge(disconnect$, error$).subscribe();
    this.subscriptions.set(socket.id, subscription);
    
    // Emit socket connect event
    this.socketConnect$.next({ socketId: socket.id, socket });
    this.socketEvent$.next({ 
      socketId: socket.id, 
      event: 'connect',
      data: initialData as TData 
    });
    
   
    this.emitStatusUpdate();
    
    return socket.id;
  }
  
  /**
   * Unregister and disconnect a socket
   *
   * @param socketId The ID of the socket to unregister
   * @param reason Optional reason for unregistering
   */
  unregisterSocket(socketId: string, reason = 'manual-unregister'): void {
    const socket = this.sockets.get(socketId);
    const info = this.socketInfo.get(socketId);
    
    if (!socket && !info) {
      this.logger.warn(`Attempted to unregister unknown socket: ${socketId}`);
      return;
    }
    
    this.logger.debug(`Unregistering socket: ${socketId}, reason: ${reason}`);
    
    // Update socket info if available
    if (info) {
      info.disconnectTime = new Date();
      info.events.push({
        type: 'disconnect',
        timestamp: new Date(),
        data: { reason } as unknown as TData
      });
      
      // Keep the info for history but mark as disconnected
      this.socketInfo.set(socketId, info);
    }
    
    // Clean up socket
    if (socket) {
      if (socket.connected) {
        socket.disconnect(true);
      }
      this.sockets.delete(socketId);
    }
    
    // Clean up subscription
    const subscription = this.subscriptions.get(socketId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(socketId);
    }
    
    // Update metrics
    this.metrics.disconnections++;
    this.metrics.activeConnections = this.getActiveSockets().length;
    this.emitMetricsUpdate();
    
    // Emit events
    this.socketDisconnect$.next({ socketId });
    this.socketEvent$.next({ 
      socketId, 
      event: 'disconnect',
      data: { reason } as unknown as TData
    });
    
    // Update status
    this.emitStatusUpdate();
  }
  
  /**
   * Record a message sent to a client
   *
   * @param socketId The target socket ID
   * @param eventName The name of the event
   * @param data The data sent
   */
  recordMessageSent(socketId: string, eventName: string, data?: TData): void {
    this.recordEvent(socketId, 'send', { eventName, data } as unknown as TData);
    this.metrics.messagesSent++;
    this.emitMetricsUpdate();
    
    this.socketEvent$.next({
      socketId,
      event: `send:${eventName}`,
      data
    });
  }
  
  /**
   * Record a message received from a client
   *
   * @param socketId The source socket ID
   * @param eventName The name of the event
   * @param data The data received
   */
  recordMessageReceived(socketId: string, eventName: string, data?: TData): void {
    this.recordEvent(socketId, 'receive', { eventName, data } as unknown as TData);
    this.metrics.messagesReceived++;
    this.emitMetricsUpdate();
    
    this.socketEvent$.next({
      socketId,
      event: `receive:${eventName}`,
      data
    });
  }

  /**
   * Get currently active sockets
   * 
   * @returns Array of active socket information objects
   */
  getActiveSockets(): SocketInfo<TData>[] {
    return Array.from(this.socketInfo.values())
      .filter(info => !info.disconnectTime);
  }
  
  /**
   * Get all socket information (including disconnected)
   * 
   * @returns Array of all socket information objects
   */
  getAllSockets(): SocketInfo<TData>[] {
    return Array.from(this.socketInfo.values());
  }
  
  /**
   * Get current socket metrics
   * 
   * @returns Socket metrics object
   */
  getMetrics(): SocketMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Find a socket by ID
   * 
   * @param socketId Socket ID to find
   * @returns Socket instance if found, undefined otherwise
   */
  getSocket(socketId: string): Socket | undefined {
    return this.sockets.get(socketId);
  }
  
  /**
   * Get socket information by ID
   * 
   * @param socketId Socket ID to find
   * @returns Socket information if found, undefined otherwise
   */
  getSocketInfo(socketId: string): SocketInfo<TData> | undefined {
    return this.socketInfo.get(socketId);
  }
  
  /**
   * Observe socket events
   * 
   * @returns Observable of socket events
   */
  socketEvents(): Observable<{ socketId: string; event: string; data?: TData }> {
    return this.socketEvent$.asObservable().pipe(share());
  }
  
  /**
   * Observe socket errors
   * 
   * @returns Observable of socket errors
   */
  socketErrors(): Observable<{ socketId: string; error: unknown }> {
    return this.socketError$.asObservable().pipe(share());
  }
  
  /**
   * Observe socket connections
   * 
   * @returns Observable of socket connect events
   */
  socketConnections(): Observable<{ socketId: string; socket: Socket }> {
    return this.socketConnect$.asObservable().pipe(share());
  }
  
  /**
   * Observe socket disconnections
   * 
   * @returns Observable of socket disconnect events
   */
  socketDisconnections(): Observable<{ socketId: string }> {
    return this.socketDisconnect$.asObservable().pipe(share());
  }
  
  /**
   * Observe metrics updates
   * 
   * @returns Observable of socket metrics
   */
  metricUpdates(): Observable<SocketMetrics> {
    return this.metricsUpdate$.asObservable().pipe(share());
  }
  
  /**
   * Observe status updates
   * 
   * @returns Observable of socket status updates
   */
  statusUpdates(): Observable<SocketStatusUpdate<TData>> {
    return this.statusUpdate$.asObservable().pipe(share());
  }
  
  /**
   * Send a message to all connected sockets
   * 
   * @param event Event name to emit
   * @param data Data to send
   * @param filter Optional filter function to select specific sockets
   * @returns Number of sockets the message was sent to
   */
  broadcast(
    event: string, 
    data: unknown, 
    filter?: (socket: Socket) => boolean
  ): number {
    let count = 0;
    
    this.sockets.forEach((socket, socketId) => {
      if (!socket.connected) return;
      if (filter && !filter(socket)) return;
      
      try {
        socket.emit(event, data);
        this.recordMessageSent(socketId, event, data as TData);
        count++;
      } catch (error) {
        this.handleError(socketId, error);
      }
    });
    
    return count;
  }

  /**
   * Clean up all resources when module is destroyed
   * This satisfies the ESLint rule by explicitly calling disconnect/unsubscribe on each property
   */
  onModuleDestroy(): void {
    this.logger.log('Socket registry service destroying, cleaning up resources');
    
    // Notify all connected sockets of shutdown
    this.broadcast('server-shutdown', {
      status: 'shutdown',
      message: 'Server is shutting down. Your connection will be terminated.',
      timestamp: new Date().toISOString()
    });
    
    // Complete all subjects
    this.destroy$.next();
    this.destroy$.complete();
    
    // Complete and explicitly unsubscribe from all subjects
    this.socketEvent$.complete();
    this.socketEvent$.unsubscribe();
    
    this.socketError$.complete();
    this.socketError$.unsubscribe();
    
    this.socketConnect$.complete();
    this.socketConnect$.unsubscribe();
    
    this.socketDisconnect$.complete();
    this.socketDisconnect$.unsubscribe();
    
    this.metricsUpdate$.complete();
    this.metricsUpdate$.unsubscribe();
    
    this.statusUpdate$.complete();
    this.statusUpdate$.unsubscribe();
    
    // Unsubscribe all per-socket subscriptions
    this.subscriptions.forEach((sub, socketId) => {
      sub.unsubscribe();
      this.logger.debug(`Unsubscribed socket subscription: ${socketId}`);
    });
    
    // Disconnect all sockets
    this.sockets.forEach((socket, socketId) => {
      try {
        socket.removeAllListeners();
        if (socket.connected) {
          socket.disconnect(true);
        }
      } catch (err) {
        this.logger.error(`Error disconnecting socket ${socketId}: ${err}`);
      }
    });
    
    // Clear all collections
    this.subscriptions.clear();
    this.sockets.clear();
    this.socketInfo.clear();
    
    // Reset metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      disconnections: 0,
      errors: 0,
      messagesSent: 0,
      messagesReceived: 0
    };
    
    this.logger.log('Socket registry service destroyed');
  }

  /**
   * Added to satisfy ESLint rule requiring ngOnDestroy
   * In a NestJS application, we use onModuleDestroy instead,
   * but this makes the linter happy
   */
  ngOnDestroy(): void {
    // Call the NestJS lifecycle hook that contains the actual implementation
    this.onModuleDestroy();
  }

  /**
   * Handle socket disconnect events
   * 
   * @private
   * @param socketId ID of the disconnected socket
   */
  private handleDisconnect(socketId: string): void {
    const info = this.socketInfo.get(socketId);
    
    if (info && !info.disconnectTime) {
      info.disconnectTime = new Date();
      info.events.push({
        type: 'disconnect',
        timestamp: new Date()
      });
      
      // Keep the record but mark as disconnected
      this.socketInfo.set(socketId, info);
      
      // Update sockets map
      this.sockets.delete(socketId);
      
      // Update metrics
      this.metrics.disconnections++;
      this.metrics.activeConnections = this.getActiveSockets().length;
      this.emitMetricsUpdate();
      
      // Emit events
      this.socketDisconnect$.next({ socketId });
      this.socketEvent$.next({ 
        socketId, 
        event: 'disconnect' 
      });
      
      // Update status
      this.emitStatusUpdate();
      
      this.logger.debug(`Socket disconnected: ${socketId}`);
    }
  }

  /**
   * Handle socket error events
   * 
   * @private
   * @param socketId ID of the socket with an error
   * @param error Error object
   */
  private handleError(socketId: string, error: unknown): void {
    this.metrics.errors++;
    
    // Record the error event
    this.recordEvent(socketId, 'error', error as TData);
    
    // Emit error event
    this.socketError$.next({ socketId, error });
    this.socketEvent$.next({ 
      socketId, 
      event: 'error',
      data: error as TData
    });
    
    this.emitMetricsUpdate();
    this.logger.error(`Socket ${socketId} error: ${error}`);
  }
  
  /**
   * Record an event for a socket
   * 
   * @private
   * @param socketId Socket ID
   * @param eventType Event type
   * @param data Optional event data
   */
  private recordEvent(socketId: string, eventType: string, data?: TData): void {
    const info = this.socketInfo.get(socketId);
    
    if (info) {
      // Update last activity time
      info.lastActivity = new Date();
      
      // Add event to history
      info.events.push({
        type: eventType,
        timestamp: new Date(),
        data
      } as DiagnosticSocketEvent<TData>);
      
      // Limit history size
      if (info.events.length > 100) {
        info.events = info.events.slice(-100);
      }
      
      // Update the socket info
      this.socketInfo.set(socketId, info);
    }
  }
  
  /**
   * Emit a metrics update
   * 
   * @private
   */
  private emitMetricsUpdate(): void {
    this.metricsUpdate$.next({ ...this.metrics });
  }
  
  /**
   * Emit a status update
   * 
   * @private
   */
  private emitStatusUpdate(): void {
    this.statusUpdate$.next({
      activeSockets: this.getActiveSockets(),
      metrics: { ...this.metrics }
    });
  }
}