import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * Information about a socket connection
 */
interface SocketInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: Date;
  disconnectTime?: Date;
  lastActivity: Date;
  events: {
    type: string;
    timestamp: Date;
    data?: any;
  }[];
}

@Injectable()
export class SocketRegistryService {
  private readonly logger = new Logger(SocketRegistryService.name);
  private readonly activeSockets: Map<string, SocketInfo> = new Map();
  private totalConnections = 0;
  private disconnections = 0;
  private errors = 0;
  private messagesSent = 0;
  private messagesReceived = 0;

  /**
   * Register a new socket connection
   */
  registerSocket(socket: Socket): void {
    const socketInfo: SocketInfo = {
      id: socket.id,
      namespace: socket.nsp.name,
      clientIp: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
      connectTime: new Date(),
      lastActivity: new Date(),
      events: [
        {
          type: 'connect',
          timestamp: new Date(),
        },
      ],
    };
    
    this.activeSockets.set(socket.id, socketInfo);
    this.totalConnections++;
    this.logger.debug(`Socket registered: ${socket.id}`);
  }

  /**
   * Unregister a socket connection
   */
  unregisterSocket(socketId: string): void {
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      socketInfo.disconnectTime = new Date();
      socketInfo.events.push({
        type: 'disconnect',
        timestamp: new Date(),
      });
      
      this.disconnections++;
      this.logger.debug(`Socket unregistered: ${socketId}`);
      // Keep the socket info for history but mark as disconnected
      this.activeSockets.set(socketId, socketInfo);
    }
  }

  /**
   * Get all active sockets
   */
  getActiveSockets(): SocketInfo[] {
    return Array.from(this.activeSockets.values())
      .filter(socket => !socket.disconnectTime);
  }

  /**
   * Get socket metrics
   */
  getSocketMetrics() {
    return {
      totalConnections: this.totalConnections,
      activeConnections: this.getActiveSockets().length,
      disconnections: this.disconnections,
      errors: this.errors,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
    };
  }

  /**
   * Record a message sent event
   */
  recordMessageSent(socketId: string, event: string, data?: any): void {
    this.messagesSent++;
    this.recordEvent(socketId, 'send', { event, data });
  }

  /**
   * Record a message received event
   */
  recordMessageReceived(socketId: string, event: string, data?: any): void {
    this.messagesReceived++;
    this.recordEvent(socketId, 'receive', { event, data });
  }

  /**
   * Record a socket error
   */
  recordError(socketId: string, error: any): void {
    this.errors++;
    this.recordEvent(socketId, 'error', error);
  }

  /**
   * Record a socket event
   */
  private recordEvent(socketId: string, type: string, data?: any): void {
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      socketInfo.lastActivity = new Date();
      socketInfo.events.push({
        type,
        timestamp: new Date(),
        data,
      });
      
      // Limit the number of events stored per socket
      if (socketInfo.events.length > 100) {
        socketInfo.events = socketInfo.events.slice(-100);
      }
      
      this.activeSockets.set(socketId, socketInfo);
    }
  }
}
