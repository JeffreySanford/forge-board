import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketRegistryService } from '../socket/socket-registry.service';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

// Ensure namespace starts with a forward slash for clarity and consistency
@WebSocketGateway({
  namespace: '/metrics',
  cors: {
    origin: '*',
  },
})
export class MetricsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MetricsGateway.name);
  
  private metricsInterval: NodeJS.Timeout;
  private intervalTime = 500;

  constructor(private socketRegistry: SocketRegistryService) {
    this.logger.log('MetricsGateway created');
  }

  afterInit(server: Server) {
    this.logger.log('MetricsGateway initialized.  Server instance:', server);
    this.logger.log('Metrics Socket.IO server initialized with namespace /metrics');
    this.startMetricsEmission();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to metrics namespace: ${client.id}`);
    
    // Register socket with registry
    this.socketRegistry.registerSocket(client, '/metrics');
    
    // Emit connection status to client
    client.emit('connection-status', createSocketResponse('connection-status', { connected: true }));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from metrics namespace: ${client.id}`);
    // The registry service handles the disconnect event
  }

  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(client: Socket) {
    this.logger.log(`Client ${client.id} subscribed to metrics`);
    return { event: 'metrics-subscribed', data: createSocketResponse('metrics-subscribed', { success: true }) };
  }

  @SubscribeMessage('set-interval')
  handleSetInterval(client: Socket, interval: number) {
    this.logger.log(`Client ${client.id} set interval to ${interval}ms`);
    if (typeof interval === 'number' && interval >= 100 && interval <= 10000) {
      this.intervalTime = interval;
      this.restartMetricsEmission();
      return { event: 'interval-set', data: createSocketResponse('interval-set', { success: true, interval }) };
    }
    this.logger.warn(`Invalid interval requested by client ${client.id}: ${interval}ms`);
    return { event: 'interval-set', data: createSocketResponse('interval-set', { success: false, message: 'Invalid interval' }) };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    this.logger.debug(`Ping from client ${client.id}`);
    return { event: 'pong', data: createSocketResponse('pong', { timestamp: new Date().toISOString() }) };
  }

  private startMetricsEmission() {
    this.logger.log(`Starting metrics emission with interval ${this.intervalTime}ms`);
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      const metrics = {
        cpu: 40 + Math.random() * 20,
        memory: 60 + Math.random() * 15,
        time: new Date().toISOString(),
        disk: 55 + Math.random() * 10,
        network: 30 + Math.random() * 25
      };

      const response = createSocketResponse('system-metrics', metrics);
      this.logger.debug('Emitting metrics to all clients', { metrics });
      this.server.emit('system-metrics', response);
    }, this.intervalTime);
  }

  private restartMetricsEmission() {
    this.logger.log(`Restarting metrics emission with new interval: ${this.intervalTime}ms`);
    this.startMetricsEmission();
  }
}
