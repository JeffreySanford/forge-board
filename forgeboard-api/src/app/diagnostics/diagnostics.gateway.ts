import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';
import { SocketRegistryService } from '../socket/socket-registry.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { SocketLoggerService } from '../socket/socket-logger.service';

@WebSocketGateway({
  namespace: 'diagnostics',
  cors: {
    origin: '*',
  },
})
export class DiagnosticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(DiagnosticsGateway.name);

  private healthInterval: NodeJS.Timeout;
  private socketStatusInterval: NodeJS.Timeout;

  constructor(
    private socketRegistry: SocketRegistryService,
    private diagnosticsService: DiagnosticsService,
    private readonly socketLogger: SocketLoggerService
  ) {
    this.logger.log('DiagnosticsGateway created');
  }

  afterInit() {
    this.logger.log('Diagnostics Socket.IO server initialized with namespace /diagnostics');
    
    // Emit health updates at regular intervals
    this.healthInterval = setInterval(() => {
      const health = this.diagnosticsService.getHealth();
      this.logger.debug('Emitting health update', health);
      // Check if there are connected clients without using size
      if (this.server && Object.keys(this.server.sockets.sockets).length > 0) {
        this.server.emit('health-update', createSocketResponse('health-update', health));
      }
    }, 10000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to diagnostics namespace: ${client.id}`);
    // Update to pass only the socket parameter
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
  }
  
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from diagnostics namespace: ${client.id}`);
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'disconnect',
      'Client disconnected'
    );
  }
  
  @SubscribeMessage('get-health')
  handleGetHealth(client: Socket) {
    this.logger.verbose(`Client ${client.id} requested health data`);
    const health = this.diagnosticsService.getHealth();
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-health',
      'Client requested health data'
    );
    
    return { event: 'health-data', data: createSocketResponse('health-data', health) };
  }
  
  @SubscribeMessage('get-socket-status')
  handleGetSocketStatus(client: Socket) {
    this.logger.verbose(`Client ${client.id} requested socket status`);
    
    const activeSockets = this.socketRegistry.getActiveSockets().map(s => ({
      id: s.id,
      namespace: s.namespace,
      clientIp: s.clientIp,
      userAgent: s.userAgent,
      connectTime: s.connectTime,
      lastActivity: s.lastActivity
    }));
    
    const metrics = this.socketRegistry.getMetrics();
    
    const response = { activeSockets, metrics };
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-socket-status',
      'Client requested socket status'
    );
    
    return {
      event: 'socket-status',
      data: createSocketResponse('socket-status', response)
    };
  }
  
  @SubscribeMessage('get-socket-logs')
  handleGetSocketLogs(client: Socket) {
    this.logger.verbose(`Client ${client.id} requested socket logs`);
    
    const logs = this.socketLogger.getLogs();
    
    this.socketLogger.log(
      client.id,
      'diagnostics',
      'get-socket-logs',
      'Client requested socket logs'
    );
    
    return {
      event: 'socket-logs',
      data: createSocketResponse('socket-logs', logs)
    };
  }
  
  onModuleDestroy() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    if (this.socketStatusInterval) {
      clearInterval(this.socketStatusInterval);
      this.socketStatusInterval = null;
    }
    
    // Any other cleanup needed
    this.logger.log('Diagnostics gateway resources cleaned up');
  }

  private sendSocketLogs(client: Socket): void {
    const logs = this.socketLogger.getLogs(100); // Add limit parameter
    client.emit('socket-logs', createSocketResponse('socket-logs', logs));
  }
}
