import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../app/logger/logger.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: false
  }
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private metricsInterval: NodeJS.Timeout;
  private interval = 500;
  
  constructor(private readonly logger: LoggerService) {}

  afterInit(server: Server) {
    this.logger.info('Socket.IO server initialized', 'SocketGateway');
    this.startMetricsEmission();
  }

  handleConnection(client: Socket) {
    this.logger.info(`Client connected: ${client.id}`, 'SocketGateway', { clientId: client.id });
    client.emit('connection-status', {
      status: 'success',
      data: { connected: true },
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.info(`Client disconnected: ${client.id}`, 'SocketGateway', { clientId: client.id });
  }

  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(client: Socket) {
    this.logger.info(`Client ${client.id} subscribed to metrics`, 'SocketGateway', { 
      clientId: client.id, 
      event: 'subscribe-metrics' 
    });
    return { event: 'metrics-subscribed', data: { success: true } };
  }

  @SubscribeMessage('set-interval')
  handleSetInterval(client: Socket, interval: number) {
    if (typeof interval === 'number' && interval >= 100 && interval <= 10000) {
      this.interval = interval;
      this.restartMetricsEmission();
      this.logger.info(`Client ${client.id} set metrics interval to ${interval}ms`, 'SocketGateway', {
        clientId: client.id,
        interval,
        event: 'set-interval'
      });
      return { event: 'interval-set', data: { success: true, interval } };
    }
    
    this.logger.warning(`Client ${client.id} attempted to set invalid interval: ${interval}`, 'SocketGateway', {
      clientId: client.id,
      invalidInterval: interval,
      event: 'set-interval'
    });
    return { event: 'interval-set', data: { success: false, message: 'Invalid interval' } };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    this.logger.debug(`Ping received from client ${client.id}`, 'SocketGateway', { 
      clientId: client.id,
      event: 'ping'
    });
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  private startMetricsEmission() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.logger.info(`Starting metrics emission with interval ${this.interval}ms`, 'SocketGateway', {
      interval: this.interval,
      action: 'startMetricsEmission'
    });
    
    this.metricsInterval = setInterval(() => {
      const metrics = {
        cpu: 40 + Math.random() * 20,
        memory: 60 + Math.random() * 15,
        time: new Date().toISOString(),
        disk: 55 + Math.random() * 10,
        network: 30 + Math.random() * 25
      };

      this.server.emit('system-metrics', {
        status: 'success',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    }, this.interval);
  }

  private restartMetricsEmission() {
    this.logger.info('Restarting metrics emission', 'SocketGateway', { 
      interval: this.interval,
      action: 'restartMetricsEmission'
    });
    this.startMetricsEmission();
  }
}
