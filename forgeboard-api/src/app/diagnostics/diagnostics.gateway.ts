import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DiagnosticsService } from './diagnostics.service';
import { createSocketResponse, HealthTimelinePoint, SocketResponse, SocketLogEvent } from '@forge-board/shared/api-interfaces';
import { SocketRegistryService } from '../socket/socket-registry.service';
import { SocketLoggerService } from '../socket/socket-logger.service';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  namespace: 'diagnostics',
  cors: {
    origin: '*',
  },
})
export class DiagnosticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;
  
  private healthInterval!: NodeJS.Timeout;
  private socketStatusInterval!: NodeJS.Timeout;
  private readonly logger = new Logger(DiagnosticsGateway.name);
  private timelineSubscription!: Subscription;

  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    private readonly socketRegistry: SocketRegistryService,
    private readonly socketLogger: SocketLoggerService,
  ) {
    this.logger.log('DiagnosticsGateway created');
  }

  afterInit(): void {
    this.logger.log('Diagnostics Socket.IO server initialized with namespace /diagnostics');
    
    // Emit health updates at regular intervals
    this.healthInterval = setInterval(() => {
      const health = this.diagnosticsService.getHealth();
      this.logger.debug('Emitting health update', health);
      // Check if there are connected clients
      if (this.server && Object.keys(this.server.sockets.sockets).length > 0) {
        this.server.emit('health-update', createSocketResponse('health-update', health));
      }
    }, 10000);
    
    // Emit socket status updates at regular intervals
    this.socketStatusInterval = setInterval(() => {
      // Get active sockets and metrics
      const activeSockets = this.socketRegistry.getActiveSockets();
      const metrics = this.socketRegistry.getMetrics();
      
      const status = {
        activeSockets,
        metrics
      };
      
      this.logger.debug('Emitting socket status update');
      if (this.server && Object.keys(this.server.sockets.sockets).length > 0) {
        this.server.emit('socket-status', createSocketResponse('socket-status', status));
      }
    }, 15000);

    // Subscribe to timelinePoints and emit updates
    this.timelineSubscription = this.diagnosticsService.timelinePoints$.subscribe(
      (points: HealthTimelinePoint[]) => {
        this.logger.verbose(`Emitting timeline update with ${points.length} points.`);
        this.server.emit('timeline-update', createSocketResponse('timeline-update', points));
      }
    );
  }

  handleConnection(client: Socket): void {
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
    client.emit('health-update', createSocketResponse('health-update', health));

    // Send initial timeline data
    const timelinePoints = this.diagnosticsService.getTimelinePointsValue();
    client.emit('timeline-update', createSocketResponse('timeline-update', timelinePoints));
  }
  
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from diagnostics namespace: ${client.id}`);
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'disconnect',
      'Client disconnected'
    );
  }
  
  @SubscribeMessage('get-health')
  handleGetHealth(client: Socket): SocketResponse<unknown> {
    this.logger.verbose(`Client ${client.id} requested health data`);
    const health = this.diagnosticsService.getHealth();
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-health',
      'Client requested health data'
    );
    
    return createSocketResponse('health-data', health);
  }
  
  @SubscribeMessage('get-socket-status')
  handleGetSocketStatus(client: Socket): SocketResponse<{ activeSockets: unknown; metrics: unknown }> {
    this.logger.verbose(`Client ${client.id} requested socket status`);
    
    // Get active sockets and metrics
    const activeSockets = this.socketRegistry.getActiveSockets();
    const metrics = this.socketRegistry.getMetrics();
    
    const status = {
      activeSockets,
      metrics
    };
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-socket-status',
      'Client requested socket status'
    );
    
    return createSocketResponse('socket-status', status);
  }
  
  @SubscribeMessage('get-socket-logs')
  handleGetSocketLogs(client: Socket): SocketResponse<SocketLogEvent[]> {
    this.logger.verbose(`Client ${client.id} requested socket logs`);
    // getLogs takes a number limit, not a socketId
    const logs = this.socketLogger.getLogs(50); // Get the last 50 logs
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-socket-logs',
      `Client requested socket logs. Found ${logs.length} logs.`,
      { count: logs.length }
    );
    
    return createSocketResponse('socket-logs-data', logs);
  }

  onModuleDestroy(): void {
    this.logger.log('Destroying DiagnosticsGateway, clearing intervals and subscriptions.');
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    if (this.socketStatusInterval) {
      clearInterval(this.socketStatusInterval);
    }
    if (this.timelineSubscription) {
      this.timelineSubscription.unsubscribe();
    }
  }
}
