import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LogEntry, LogLevelEnum } from '@forge-board/shared/api-interfaces';
import { LogsService } from './logs.service';
import { SocketRegistryService } from '../socket/socket-registry.service';

// Define LogFilter interface locally since there's an issue with importing it
interface LogFilter {
  level?: LogLevelEnum | LogLevelEnum[];
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
  afterTimestamp?: string;
}

@WebSocketGateway({
  namespace: '/logs',
  cors: {
    origin: '*',
    credentials: false
  }
})
export class LogGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server; // Added definite assignment assertion
  private readonly logger = new Logger(LogGateway.name);
  private activeClients = new Map<string, LogFilter>();

  constructor(
    private logsService: LogsService,
    private socketRegistry: SocketRegistryService
  ) {}

  afterInit(_server: Server) { // Prefixed server with _ as it's unused but required by interface
    this.logger.log('Logs WebSocket Gateway initialized');
    console.log('Current server:', _server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to logs: ${client.id}`);
    this.socketRegistry.registerSocket(client);
    
    // Set default filter
    this.activeClients.set(client.id, {
      level: undefined,
      service: '',
      limit: 100
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from logs: ${client.id}`);
    this.activeClients.delete(client.id);
    this.socketRegistry.removeSocket(client.id, 'client-disconnect'); // Changed unregisterSocket to removeSocket
  }

  @SubscribeMessage('subscribe-logs')
  handleSubscribe(client: Socket, filter?: LogFilter) {
    if (filter) {
      this.activeClients.set(client.id, filter);
    }
    
    // Emit initial data
    const logs = this.logsService.getLogs(filter || {});
    client.emit('log-stream', {
      status: 'success',
      data: {
        logs: logs.logs,
        append: false
      }
    });
    
    return { status: 'success' };
  }

  @SubscribeMessage('update-filter')
  handleUpdateFilter(client: Socket, filter: LogFilter) {
    this.activeClients.set(client.id, filter);
    
    // Get logs with updated filter
    const logs = this.logsService.getLogs(filter);
    client.emit('log-stream', {
      status: 'success',
      data: {
        logs: logs.logs,
        append: false
      }
    });
    
    return { status: 'success' };
  }

  @SubscribeMessage('get-latest-logs')
  handleGetLatest(client: Socket, options: { afterTimestamp?: string }) {
    const filter = { 
      ...this.activeClients.get(client.id),
      afterTimestamp: options?.afterTimestamp
    };
    
    const logs = this.logsService.getLogs(filter);
    client.emit('log-stream', {
      status: 'success',
      data: {
        logs: logs.logs,
        append: true
      }
    });
    
    return { status: 'success' };
  }
  
  // Method to broadcast a new log to all clients
  emitNewLog(log: LogEntry): void {
    this.server.emit('backend-log-entry', {
      status: 'success',
      data: log
    });
  }
}
