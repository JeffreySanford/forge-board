import { 
  WebSocketGateway, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  OnGatewayInit, 
  WebSocketServer 
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketRegistryService } from './socket-registry.service';
import { SocketLoggerService } from './socket-logger.service';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);
  private metricsInterval: NodeJS.Timeout;
  private intervalTime = 5000; // Default interval time
  
  constructor(
    private readonly socketRegistry: SocketRegistryService,
    private readonly socketLogger: SocketLoggerService
  ) {}
  
  /**
   * Socket.IO server initialization logic
   */
  afterInit(server: Server) {
    this.logger.log('Socket gateway initialized');
    
    // Setup namespaces
    const metricsNamespace = server.of('/metrics');
    const diagnosticsNamespace = server.of('/diagnostics');
    
    // Setup namespace connection handlers
    metricsNamespace.on('connection', (socket) => this.handleConnection(socket, 'metrics'));
    diagnosticsNamespace.on('connection', (socket) => this.handleConnection(socket, 'diagnostics'));
  }
  
  /**
   * Handle new socket connection
   */
  handleConnection(socket: Socket, namespace?: string): void {
    console.log(`Client connected: ${socket.id} to namespace ${namespace || socket.nsp.name}`);
  
    // Register socket with registry
    this.socketRegistry.registerSocket(socket);
    
    // Additional handling with the namespace parameter if needed
    if (namespace) {
      console.log(`Socket ${socket.id} connected to ${namespace} namespace`);
      // Extra namespace-specific handling can go here
    }
  }
  
  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Log disconnect event
    this.socketLogger.log(
      client.id,
      'unknown', // The namespace isn't easily accessible here
      'disconnect',
      'Client disconnected'
    );
  }
  
  /**
   * Setup metrics-specific event handlers
   */
  private setupMetricsEvents(client: Socket) {
    // Handle subscription to metrics
    client.on('subscribe-metrics', () => {
      this.logger.verbose(`Client ${client.id} subscribed to metrics`);
      this.socketLogger.log(
        client.id,
        'metrics',
        'subscribe',
        'Subscribed to metrics updates'
      );
      
      // Send initial metrics data
      const mockMetrics = {
        cpu: 45 + Math.random() * 10,
        memory: 60 + Math.random() * 15,
        time: new Date().toISOString(),
        disk: 55 + Math.random() * 10,
        network: 30 + Math.random() * 20
      };
      
      client.emit('system-metrics', createSocketResponse('system-metrics', mockMetrics));
      this.socketRegistry.incrementMessageSent();
    });
    
    // Handle interval setting
    client.on('set-interval', (interval: number) => {
      this.logger.verbose(`Client ${client.id} set metrics interval to ${interval}ms`);
      this.socketLogger.log(
        client.id,
        'metrics',
        'interval',
        `Set metrics interval to ${interval}ms`, 
        { interval }
      );
      this.intervalTime = interval;
      this.startMetricsEmission();
      this.socketRegistry.incrementMessageReceived();
    });

    this.startMetricsEmission();
  }
  
  /**
   * Setup diagnostics-specific event handlers
   */
  private setupDiagnosticsEvents(client: Socket) {
    // Handle get socket status request
    client.on('get-socket-status', () => {
      this.logger.verbose(`Client ${client.id} requested socket status`);
      
      const activeSockets = this.socketRegistry.getActiveSockets().map(s => ({
        id: s.id,
        namespace: s.namespace,
        clientIp: s.clientIp,
        userAgent: s.userAgent,
        connectTime: s.connectTime,
        lastActivity: s.lastActivity
      }));
      
      const response = {
        activeSockets,
        metrics: this.socketRegistry.getMetrics()
      };
      
      client.emit('socket-status', createSocketResponse('socket-status', response));
      this.socketRegistry.incrementMessageSent();
      this.socketRegistry.incrementMessageReceived();
    });
    
    // Handle get socket logs request
    client.on('get-socket-logs', () => {
      this.logger.verbose(`Client ${client.id} requested socket logs`);
      
      const logs = this.socketLogger.getLogs();
      client.emit('socket-logs', createSocketResponse('socket-logs', logs));
      
      this.socketRegistry.incrementMessageSent();
      this.socketRegistry.incrementMessageReceived();
    });
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

      // Fixed: Use the correct signature with both arguments
      const response = createSocketResponse('system-metrics', metrics);
      this.server.emit('system-metrics', response);
    }, this.intervalTime);
  }
}
