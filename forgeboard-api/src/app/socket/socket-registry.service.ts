import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketInfo, SocketMetrics, SocketLogEvent } from '@forge-board/shared/api-interfaces';

@Injectable()
export class SocketRegistryService {
  private readonly logger = new Logger(SocketRegistryService.name);
  private sockets: Map<string, Socket> = new Map();
  private socketInfo: Map<string, SocketInfo> = new Map();
  private socketLogs: SocketLogEvent[] = [];
  private connectionHistory: SocketInfo[] = [];
  
  // Metrics tracking
  private metrics: SocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
  };

  /**
   * Register a new socket connection
   * @param socket The socket instance to register
   * @param namespace Optional namespace name
   */
  registerSocket(socket: Socket, namespace: string = 'default'): void {
    this.logger.log(`Registering socket: ${socket.id} in namespace: ${namespace}`);
    
    // Store socket instance
    this.sockets.set(socket.id, socket);
    
    // Create socket info
    const socketInfo: SocketInfo = {
      id: socket.id,
      namespace: namespace,
      clientIp: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
      connectTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      events: [],
      connected: new Date().toISOString(), // Added missing property
      status: 'connected' // Added missing property
    };
    
    // Store socket info
    this.socketInfo.set(socket.id, socketInfo);
    this.connectionHistory.push({ ...socketInfo });
    
    // Update metrics
    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.sockets.size;
    
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
    const socketInfo = this.socketInfo.get(socketId);
    if (socketInfo) {
      socketInfo.disconnectTime = new Date().toISOString();
      
      // Add to connection history
      const historyEntry = this.connectionHistory.find(h => h.id === socketId);
      if (historyEntry) {
        historyEntry.disconnectTime = new Date().toISOString();
      }
    }
    
    // Remove from active sockets
    this.sockets.delete(socketId);
    
    // Update metrics
    this.metrics.disconnections++;
    this.metrics.activeConnections = this.sockets.size;
    
    // Log the event
    this.logSocketEvent(socketId, 'disconnect', 'Socket disconnected');
  }
  
  /**
   * Log a socket event
   */
  private logSocketEvent(socketId: string, eventType: string, message: string, data?: any): void {
    // Update last activity time
    const socketInfo = this.socketInfo.get(socketId);
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
      type: eventType, // Corrected property name
      timestamp: new Date().toISOString(),
      message,
      data
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
    return Array.from(this.socketInfo.values())
      .filter(info => !info.disconnectTime);
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
  getLogs(limit: number = 50): SocketLogEvent[] {
    return this.socketLogs.slice(0, limit);
  }
  
  /**
   * Get connection history
   */
  getConnectionHistory(): SocketInfo[] {
    return [...this.connectionHistory];
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
}
