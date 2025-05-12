import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketInfo, SocketMetrics, SocketLogEvent } from '@forge-board/shared/api-interfaces';

@Injectable()
export class SocketRegistryService {
  private readonly logger = new Logger(SocketRegistryService.name);
  private readonly activeSockets = new Map<string, SocketInfo>();
  private readonly metrics: SocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    lastError: null // This is now valid with our updated interface
  };
  private socketLogs: SocketLogEvent[] = [];
  private connectionHistory: SocketInfo[] = [];
  
  /**
   * Unregister a socket connection. Typically called on disconnect.
   * @param socketId The ID of the socket to unregister
   * @param reason Optional reason for unregistering
   */
  unregisterSocket(socketId: string, reason?: string): void {
    this.logger.log(`Unregistering socket: ${socketId}. Reason: ${reason || 'N/A'}`);
    this.handleDisconnect(socketId); // handleDisconnect already logs and updates metrics
  }

  /**
   * Register a new socket connection
   * @param socket The socket instance to register
   * @param namespace Optional namespace name
   */
  registerSocket(socket: Socket, namespace = 'default'): void {
    this.logger.log(`Registering socket: ${socket.id} in namespace: ${namespace}`);
    
    // Store socket instance
    const socketInfo: SocketInfo = {
      id: socket.id,
      namespace: namespace,
      clientIp: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
      connectTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      events: []
      // Removed invalid properties: connected and status
    };
    
    this.activeSockets.set(socket.id, socketInfo);
    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.activeSockets.size;
    
    this.logger.log(`Socket ${socket.id} registered from ${namespace}`);
    
    // Setup disconnect handler
    socket.on('disconnect', () => {
      this.handleDisconnect(socket.id);
    });
    
    // Log the event
    this.logSocketEvent(socket.id, 'connect', 'Socket connected');
  }
  
  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socketId: string): void {
    // Update socket info
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      socketInfo.disconnectTime = new Date().toISOString();
      
      // Add to connection history
      const historyEntry = this.connectionHistory.find(h => h.id === socketId);
      if (historyEntry) {
        historyEntry.disconnectTime = new Date().toISOString();
      }
    }
    
    // Remove from active sockets
    this.activeSockets.delete(socketId);
    
    // Update metrics
    this.metrics.disconnections++;
    this.metrics.activeConnections = this.activeSockets.size;
    
    // Log the event
    this.logSocketEvent(socketId, 'disconnect', 'Socket disconnected');
  }
  
  /**
   * Log a socket event
   */
  private logSocketEvent(socketId: string, eventType: string, message: string, data?: unknown): void {
    // Update last activity time
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      socketInfo.lastActivity = new Date().toISOString();
      
      // Add event to socket history
      socketInfo.events.push({
        type: eventType,
        timestamp: new Date().toISOString(),
        data: data
      });
    }
    
    // Create log entry
    const logEvent: SocketLogEvent = {
      socketId,
      namespace: socketInfo?.namespace || 'unknown',
      eventType: eventType,
      timestamp: new Date().toISOString(),
      message,
      data: data as Record<string, unknown>
    };
    
    // Add to logs array
    this.socketLogs.unshift(logEvent);
    
    // Limit logs array size
    if (this.socketLogs.length > 100) {
      this.socketLogs = this.socketLogs.slice(0, 100);
    }
  }
  
  /**
   * Get all active sockets info
   */
  getActiveSockets(): SocketInfo[] {
    return Array.from(this.activeSockets.values());
  }
  
  /**
   * Get socket metrics
   */
  getMetrics(): SocketMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get socket logs
   * @param limit Optional limit for number of logs
   */
  getLogs(limit = 50): SocketLogEvent[] {
    return this.socketLogs.slice(0, limit);
  }
  
  /**
   * Get connection history
   */
  getConnectionHistory(): SocketInfo[] {
    return [...this.connectionHistory];
  }

  /**
   * Record an error
   */
  recordError(error: Error): void {
    this.metrics.errors++;
    
    // Create a timestamp separately instead of adding it to the Error object
    const timestamp = new Date().toISOString();
    
    // Update metrics with error info
    this.metrics.lastError = error;
    
    // You might want to log the error with timestamp
    this.logger.error(`Socket error at ${timestamp}: ${error.message}`, error.stack);
    
    // Emit metrics update
    this.emitMetricsUpdate();
  }

  /**
   * Remove a socket
   */
  removeSocket(clientId: string, reason: string): void {
    if (this.activeSockets.has(clientId)) {
      this.activeSockets.delete(clientId);
      this.metrics.activeConnections = this.activeSockets.size;
      this.logger.log(`Socket ${clientId} removed. Reason: ${reason}`);
    } else {
      this.logger.warn(`Attempted to remove non-existent socket: ${clientId}`);
    }
  }

  /**
   * Increment the count of messages sent
   */
  incrementMessageSent(): void {
    this.metrics.messagesSent++;
  }

  /**
   * Increment the count of messages received
   */
  incrementMessageReceived(): void {
    this.metrics.messagesReceived++;
  }

  /**
   * Record a message received from a client
   * @param socketId The socket ID
   * @param eventType The type of event
   * @param data Optional data received
   */
  recordMessageReceived(socketId: string, eventType: string, data?: unknown): void {
    // Implement this method to fix the errors in jwt-diagnostics.gateway.ts
    this.metrics.messagesReceived++;
    
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      socketInfo.lastActivity = new Date().toISOString();
      
      // Add event to socket history
      socketInfo.events.push({
        type: eventType,
        timestamp: new Date().toISOString(),
        data
      });
    }
    
    this.logger.verbose(`Socket ${socketId} received message: ${eventType}`);
  }

  /**
   * Emit metrics update
   * This method is called when metrics change to notify any observers
   */
  private emitMetricsUpdate(): void {
    // Log metrics update for debugging
    this.logger.debug('Socket metrics updated', { 
      activeConnections: this.metrics.activeConnections,
      totalConnections: this.metrics.totalConnections,
      errors: this.metrics.errors,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived
    });
  }
}
