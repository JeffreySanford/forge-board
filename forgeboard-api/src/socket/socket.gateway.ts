import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  afterInit(server: Server) {
    console.log('Socket.IO server initialized');
    this.startMetricsEmission();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connection-status', {
      status: 'success',
      data: { connected: true },
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(client: Socket) {
    console.log(`Client ${client.id} subscribed to metrics`);
    return { event: 'metrics-subscribed', data: { success: true } };
  }

  @SubscribeMessage('set-interval')
  handleSetInterval(client: Socket, interval: number) {
    if (typeof interval === 'number' && interval >= 100 && interval <= 10000) {
      this.interval = interval;
      this.restartMetricsEmission();
      return { event: 'interval-set', data: { success: true, interval } };
    }
    return { event: 'interval-set', data: { success: false, message: 'Invalid interval' } };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  private startMetricsEmission() {
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

      this.server.emit('system-metrics', {
        status: 'success',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    }, this.interval);
  }

  private restartMetricsEmission() {
    this.startMetricsEmission();
  }
}
