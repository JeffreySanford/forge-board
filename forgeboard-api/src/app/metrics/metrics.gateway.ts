import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { createSocketResponse } from '../utils/socket-utils';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  namespace: '/metrics',
  cors: {
    origin: 'http://localhost:4200',
    credentials: false
  }
})
export class MetricsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MetricsGateway.name);
  private clientSubscriptions: Map<string, { 
    interval: number, 
    subscription: Subscription 
  }> = new Map();
  
  constructor(private metricsService: MetricsService) {}
  
  afterInit(): void {
    this.logger.log('Metrics Gateway initialized');
  }

  /**
   * Handle client connection
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected to metrics: ${client.id}`);
    
    // Initialize client data with the default global interval (3000ms)
    this.clientSubscriptions.set(client.id, { 
      interval: 3000, // Set default to 3000ms
      subscription: null 
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from metrics: ${client.id}`);
    
    // Clean up subscription for this client
    const clientData = this.clientSubscriptions.get(client.id);
    if (clientData?.subscription) {
      clientData.subscription.unsubscribe();
    }
    
    this.clientSubscriptions.delete(client.id);
  }

  /**
   * Handle subscription to metrics
   */
  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(@ConnectedSocket() client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to metrics`);
    
    // Get or initialize client data
    let clientData = this.clientSubscriptions.get(client.id);
    if (!clientData) {
      clientData = { 
        interval: 3000, // Set default to 3000ms
        subscription: null 
      };
      this.clientSubscriptions.set(client.id, clientData);
    }
    
    // Clean up any existing subscription
    if (clientData.subscription) {
      clientData.subscription.unsubscribe();
    }
    
    // Subscribe to the metrics service observable and forward to the client
    const subscription = this.metricsService.getMetrics().subscribe({
      next: (metrics) => {
        try {
          client.emit('system-metrics', createSocketResponse('system-metrics', metrics));
        } catch (err) {
          this.logger.error(`Error sending metrics to client ${client.id}: ${err.message}`, err.stack);
        }
      },
      error: (err) => {
        this.logger.error(`Error in metrics stream for client ${client.id}: ${err.message}`, err.stack);
      }
    });
    
    // Store the subscription for cleanup
    clientData.subscription = subscription;
    this.clientSubscriptions.set(client.id, clientData);
  }

  /**
   * Handle interval setting
   */
  @SubscribeMessage('set-interval')
  handleSetInterval(@ConnectedSocket() client: Socket, payload: number): void {
    try {
      const interval = typeof payload === 'number' ? payload : 3000; // Default to 3000ms
      this.logger.log(`Client ${client.id} set interval to ${interval}ms`);
      
      // Update the client's stored interval
      const clientData = this.clientSubscriptions.get(client.id);
      if (clientData) {
        clientData.interval = interval;
        this.clientSubscriptions.set(client.id, clientData);
      }
      
      // Inform the client the interval was accepted
      client.emit('interval-set', createSocketResponse('interval-set', { interval }));
      
      // Update the metrics service with the new interval
      this.metricsService.setUpdateInterval(interval).subscribe({
        next: (newInterval) => {
          this.logger.log(`Updated metrics service interval to ${newInterval}ms`);
        },
        error: (err) => {
          this.logger.error(`Failed to update metrics service interval: ${err.message}`);
        }
      });
    } catch (error) {
      this.logger.error(`Error setting interval for client ${client.id}: ${error.message}`);
      client.emit('error', createSocketResponse('error', { message: 'Failed to set interval' }));
    }
  }
}
