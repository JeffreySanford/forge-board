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
    
    // Initialize client data with default interval but no subscription yet
    this.clientSubscriptions.set(client.id, { 
      interval: 1000, // Default interval
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
        interval: 1000, 
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
      const interval = typeof payload === 'number' ? payload : 1000;
      this.logger.log(`Client ${client.id} set interval to ${interval}ms`);
      
      // Inform the client the interval was accepted
      client.emit('interval-set', createSocketResponse('interval-set', { interval }));
      
      // No need to change service interval as we're now using the global metrics stream
      // The interval is controlled at the service level, not per client
    } catch (error) {
      this.logger.error(`Error setting interval for client ${client.id}: ${error.message}`);
      client.emit('error', createSocketResponse('error', { message: 'Failed to set interval' }));
    }
  }
}
