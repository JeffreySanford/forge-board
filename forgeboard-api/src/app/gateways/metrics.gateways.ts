import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

// Change the gateway configuration to use a specific namespace
@WebSocketGateway({
  namespace: '/metrics',
  cors: {
    origin: 'http://localhost:4200',
    credentials: false
  }
})
export class MetricsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private metricsInterval: NodeJS.Timeout;
  private intervalTime = 500;

  afterInit(server: Server) {
    console.log('Metrics Socket.IO server initialized with namespace /metrics');
    // Ensure server is properly set if the decorator didn't do it
    if (!this.server) {
      this.server = server;
    }
    this.startMetricsEmission();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected to metrics namespace: ${client.id}`);
    try {
      client.emit('connection-status', createSocketResponse('connection-status', { connected: true }));
    } catch (error) {
      console.error(`Error sending connection status to client ${client.id}:`, error);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from metrics namespace: ${client.id}`);
  }

  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(client: Socket) {
    try {
      console.log(`Client ${client.id} subscribed to metrics`);
      return { event: 'metrics-subscribed', data: createSocketResponse('metrics-subscribed', { success: true }) };
    } catch (error) {
      console.error(`Error handling subscribe-metrics from client ${client.id}:`, error);
      return { event: 'error', data: createSocketResponse('error', { message: 'Error subscribing to metrics' }) };
    }
  }

  @SubscribeMessage('set-interval')
  handleSetInterval(client: Socket, interval: number) {
    try {
      if (typeof interval === 'number' && interval >= 100 && interval <= 10000) {
        this.intervalTime = interval;
        this.restartMetricsEmission();
        return { event: 'interval-set', data: createSocketResponse('interval-set', { success: true, interval }) };
      }
      return { event: 'interval-set', data: createSocketResponse('interval-set', { success: false, message: 'Invalid interval' }) };
    } catch (error) {
      console.error(`Error setting interval for client ${client.id}:`, error);
      return { event: 'interval-set', data: createSocketResponse('interval-set', { success: false, message: 'Error setting interval' }) };
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    try {
      return { event: 'pong', data: createSocketResponse('pong', { timestamp: new Date().toISOString() }) };
    } catch (error) {
      console.error(`Error handling ping from client ${client.id}:`, error);
      return { event: 'error', data: createSocketResponse('error', { message: 'Error processing ping' }) };
    }
  }

  private startMetricsEmission() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      try {
        // Check if server is initialized before proceeding
        if (!this.server) {
          console.error('Socket.IO server is not initialized');
          return;
        }

        const metrics = {
          cpu: 40 + Math.random() * 20,
          memory: 60 + Math.random() * 15,
          time: new Date().toISOString(),
          disk: 55 + Math.random() * 10,
          network: 30 + Math.random() * 25
        };

        // Create response with correct signature
        const response = createSocketResponse('system-metrics', metrics);
        
        // Safely emit to all clients
        try {
          this.server.emit('system-metrics', response);
        } catch (emitError) {
          console.error('Error emitting metrics:', emitError);
        }
      } catch (error) {
        console.error('Error in metrics emission cycle:', error);
      }
    }, this.intervalTime);
  }

  private restartMetricsEmission() {
    this.startMetricsEmission();
  }
}
