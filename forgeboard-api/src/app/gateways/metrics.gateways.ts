import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Define interfaces for type safety
interface MetricData {
  cpu: number;
  memory: number;
  time: string;
}

interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}

// Helper function to create standardized responses
function createSocketResponse<T>(data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString()
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
export class MetricsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private logger = new Logger('MetricsGateway');
  private metricsInterval: NodeJS.Timeout | null = null;
  private clients = new Map<string, Socket>();
  private intervalTime = 1000; // Default interval

  afterInit() {
    this.startMetricsEmission();
    this.logger.log('MetricsGateway initialized');
  }

  handleConnection(client: Socket) {
    this.clients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);

    // Handle client subscriptions
    client.on('subscribe-metrics', () => {
      this.logger.log(`Client ${client.id} subscribed to metrics`);
    });

    // Handle interval changes from clients
    client.on('set-metrics-interval', (interval: number) => {
      if (interval >= 100 && interval <= 5000) {
        this.intervalTime = interval;
        this.restartMetricsEmission();
        this.logger.log(`Metrics interval changed to ${interval}ms`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // If no clients are connected, we could optionally pause metrics emission
    if (this.clients.size === 0) {
      // this.stopMetricsEmission();
    }
  }

  private startMetricsEmission() {
    // Clear any existing interval
    this.stopMetricsEmission();
    
    // Start new interval
    this.metricsInterval = setInterval(() => {
      const metrics: MetricData = {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        time: new Date().toLocaleTimeString(),
      };
      
      // Create standardized response
      const response = createSocketResponse(metrics);
      
      // Emit to all clients
      this.server.emit('metrics-update', response);
    }, this.intervalTime);
  }

  private restartMetricsEmission() {
    this.startMetricsEmission();
  }

  private stopMetricsEmission() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // Clean up on application shutdown
  onModuleDestroy() {
    this.stopMetricsEmission();
  }
}
