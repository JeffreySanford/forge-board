import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DiagnosticEvent, HealthData, createSocketResponse } from '@forge-board/shared/api-interfaces';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { SocketRegistryService } from '../socket/socket-registry.service';

@Injectable()
@WebSocketGateway({
  namespace: '/diagnostics',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class DiagnosticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DiagnosticsGateway.name);
  private healthInterval: NodeJS.Timeout;
  private readonly healthUpdateInterval = 5000; // 5 seconds
  
  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    private readonly socketRegistry: SocketRegistryService
  ) {
    this.logger.log('DiagnosticsGateway created');
  }
  
  afterInit(server: Server) {
    this.logger.log('Diagnostics gateway initialized');
    this.startHealthUpdates();
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected to diagnostics: ${client.id}`);
    
    // Register socket connection - pass the namespace
    this.socketRegistry.registerSocket(client, '/diagnostics');
    
    // Send initial health data
    const healthData = this.diagnosticsService.getHealth();
    client.emit('health-update', createSocketResponse('health-update', healthData));
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
}
