import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DiagnosticEvent, MetricData, createSocketResponse } from '@forge-board/shared/api-interfaces';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { SocketRegistryService } from '../socket/socket-registry.service';
import { SocketLoggerService } from '../socket/socket-logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { Subscription } from 'rxjs';

@Injectable()
@WebSocketGateway({
  namespace: '/diagnostics',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class DiagnosticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DiagnosticsGateway.name);

  private healthInterval: NodeJS.Timeout;
  private socketStatusInterval: NodeJS.Timeout;
  private metricsSubscription: Subscription;
  private readonly healthUpdateInterval: number = 10000; // 10 seconds interval

  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    private readonly socketRegistry: SocketRegistryService,
    private readonly socketLogger: SocketLoggerService,
    private readonly metricsService: MetricsService
  ) {
    this.logger.log('DiagnosticsGateway created');
  }
  
  afterInit() {
    this.logger.log('Diagnostics Socket.IO server initialized with namespace /diagnostics');
    
    // Emit health updates at regular intervals
    this.healthInterval = setInterval(() => {
      const health = this.diagnosticsService.getHealth();
      this.server.emit('health-update', { type: 'health-update', payload: health, timestamp: new Date().toISOString(), success: true });
    }, 10000);

    // Subscribe to metrics updates and emit them
    if (this.metricsService) {
      this.metricsSubscription = this.metricsService.getMetrics().subscribe(
        (metricData: MetricData) => {
          this.server.emit('live-metric-update', { type: 'live-metric-update', payload: metricData, timestamp: new Date().toISOString(), success: true });
        },
        (error) => {
          this.logger.error('Error streaming metrics in DiagnosticsGateway', error);
        }
      );
      this.logger.log('Subscribed to live metrics stream for DiagnosticsGateway.');
    } else {
      this.logger.warn('MetricsService not available in DiagnosticsGateway for live metric streaming.');
    }
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected to diagnostics namespace: ${client.id}`);
    this.socketRegistry.registerSocket(client);
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'connect',
      `Client connected from ${client.handshake.address}`
    );
    
    // Send initial health data
    const health = this.diagnosticsService.getHealth();
    client.emit('health-update', { type: 'health-update', payload: health, timestamp: new Date().toISOString(), success: true });
  }
  
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from diagnostics: ${client.id}`);
  }
    /**
   * Start periodic health updates to all connected clients
   */
  private startHealthUpdates() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    this.healthInterval = setInterval(() => {
      const healthData = this.diagnosticsService.getHealth();
      this.server.emit('health-update', createSocketResponse('health-update', healthData));
    }, this.healthUpdateInterval);
  }

  /**
   * Handle health data request from client
   */
  @SubscribeMessage('get-health')
  handleGetHealth(client: Socket): void {
    this.logger.verbose(`Client ${client.id} requested health data`);
    const healthData = this.diagnosticsService.getHealth();
    client.emit('health-update', createSocketResponse('health-update', healthData));
  }
  
  /**
   * Handle socket status request from client
   */
  @SubscribeMessage('get-socket-status')
  handleGetSocketStatus(client: Socket): void {
    this.logger.verbose(`Client ${client.id} requested socket status`);
    
    const activeSockets = this.socketRegistry.getActiveSockets();
    const metrics = this.socketRegistry.getMetrics();
    
    client.emit('socket-status', createSocketResponse('socket-status', {
      activeSockets,
      metrics
    }));
  }
  
  /**
   * Handle socket logs request from client
   */
  @SubscribeMessage('get-socket-logs')
  handleGetSocketLogs(client: Socket): void {
    this.logger.verbose(`Client ${client.id} requested socket logs`);
    // Added the limit parameter to match the updated method signature
    const logs = this.socketRegistry.getLogs(50);
    client.emit('socket-logs', createSocketResponse('socket-logs', logs));
  }
  
  /**
   * Handle socket history request from client
   */
  @SubscribeMessage('get-socket-history')
  handleGetSocketHistory(client: Socket): void {
    this.logger.verbose(`Client ${client.id} requested socket history`);
    const history = this.socketRegistry.getConnectionHistory();
    client.emit('socket-history', createSocketResponse('socket-history', history));
  }
  
  /**
   * Emit diagnostic event to all connected clients
   */
  emitDiagnosticEvent(event: DiagnosticEvent): void {
    this.logger.log(`Emitting diagnostic event: ${event.eventType} - ${event.message}`);
    this.server.emit('diagnostic-event', createSocketResponse('diagnostic-event', event));
  }

  onModuleDestroy() {
    this.logger.log('DiagnosticsGateway onModuleDestroy');
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    if (this.socketStatusInterval) {
      clearInterval(this.socketStatusInterval);
    }
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
      this.logger.log('Unsubscribed from live metrics stream.');
    }
  }

  private sendSocketLogs(client: Socket): void {
    const logs = this.socketRegistry.getLogs(50);
    client.emit('socket-logs', createSocketResponse('socket-logs', logs));
  }
}
