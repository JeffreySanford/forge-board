import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { createSocketResponse } from '../utils/socket-utils';

@WebSocketGateway({
  namespace: '/metrics',
  cors: {
    origin: 'http://localhost:4200',
    credentials: false
  }
})
export class MetricsGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MetricsGateway.name);
  private clientIntervals: Map<string, { interval: number, timerId: NodeJS.Timeout }> = new Map();
  
  constructor(private metricsService: MetricsService) {}

  /**
   * Handle client connection
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected to metrics: ${client.id}`);
    
    // Initialize client data with default interval
    this.clientIntervals.set(client.id, { 
      interval: 1000, // Default interval
      timerId: null
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from metrics: ${client.id}`);
    
    // Clear interval for this client and remove from map
    const clientData = this.clientIntervals.get(client.id);
    if (clientData && clientData.timerId) {
      clearInterval(clientData.timerId);
    }
    this.clientIntervals.delete(client.id);
  }

  /**
   * Handle subscription to metrics
   */
  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(@ConnectedSocket() client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to metrics`);
    
    // Get or initialize client data
    let clientData = this.clientIntervals.get(client.id);
    if (!clientData) {
      clientData = { interval: 1000, timerId: null };
      this.clientIntervals.set(client.id, clientData);
    }
    
    // Clear any existing interval for this client
    if (clientData.timerId) {
      clearInterval(clientData.timerId);
    }
    
    // Start sending metrics at the specified interval
    const timerId = setInterval(() => {
      try {
        const metrics = this.metricsService.getLatestMetrics();
        client.emit('system-metrics', createSocketResponse('system-metrics', metrics));
      } catch (err) {
        this.logger.error(`Error sending metrics to client ${client.id}: ${err.message}`, err);
      }
    }, clientData.interval);
    
    // Update client data with new timer ID
    clientData.timerId = timerId;
    this.clientIntervals.set(client.id, clientData);
  }

  /**
   * Handle interval setting
   */
  @SubscribeMessage('set-interval')
  handleSetInterval(@ConnectedSocket() client: Socket, payload: number): void {
    try {
      const interval = typeof payload === 'number' ? payload : 1000;
      this.logger.log(`Client ${client.id} set interval to ${interval}ms`);
      
      // Get client data - guard against undefined by creating if needed
      let clientData = this.clientIntervals.get(client.id);
      if (!clientData) {
        clientData = { interval: interval, timerId: null };
        this.clientIntervals.set(client.id, clientData);
      } else {
        clientData.interval = interval;
      }
      
      // Clear existing interval
      if (clientData.timerId) {
        clearInterval(clientData.timerId);
      }
      
      // Start new interval with updated timing
      const timerId = setInterval(() => {
        try {
          const metrics = this.metricsService.getLatestMetrics();
          client.emit('system-metrics', createSocketResponse('system-metrics', metrics));
        } catch (err) {
          this.logger.error(`Error sending metrics to client ${client.id}: ${err.message}`, err);
        }
      }, interval);
      
      // Update client data
      clientData.timerId = timerId;
      this.clientIntervals.set(client.id, clientData);
      
      // Acknowledge the change
      client.emit('interval-set', createSocketResponse('interval-set', { interval }));
    } catch (error) {
      this.logger.error(`Error setting interval for client ${client.id}: ${error.message}`);
      client.emit('error', createSocketResponse('error', { message: 'Failed to set interval' }));
    }
  }
}
