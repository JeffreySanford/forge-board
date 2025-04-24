import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LoggerService } from './logger.service';
import { LogEntry, LogFilter, LogResponse, LogStreamUpdate } from '@forge-board/shared/api-interfaces';

@WebSocketGateway({
  namespace: '/logs',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class LoggerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LoggerGateway.name);
  private activeFilters = new Map<string, LogFilter>();
  
  constructor(private loggerService: LoggerService) {}
  
  afterInit(server: Server) {
    this.logger.log('Log WebSocket Gateway initialized');
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send latest logs on connection
    client.emit('logs', { 
      logs: this.loggerService.getLogs({ limit: 50 }),
      totalCount: this.loggerService.getLogs().length,
      filtered: false
    });
  }
  
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client's filter when they disconnect
    this.activeFilters.delete(client.id);
  }
  
  @SubscribeMessage('filter-logs')
  handleFilterLogs(client: Socket, filter: LogFilter): WsResponse<LogResponse> {
    this.logger.log(`Client ${client.id} set log filter: ${JSON.stringify(filter)}`);
    
    // Store client's filter
    this.activeFilters.set(client.id, filter);
    
    // Get filtered logs
    const logs = this.loggerService.getLogs(filter);
    const totalCount = this.loggerService.getLogs().length;
    
    return { event: 'logs', data: { logs, totalCount, filtered: true } };
  }
  
  @SubscribeMessage('subscribe-logs')
  handleSubscribe(client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to log stream`);
    
    // Client will now receive log updates via 'log-update' events
    // No need to send a response here
  }
  
  /**
   * Check if a log entry matches a filter
   */
  private logMatchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (!filter) {
      return true;
    }
    
    if (filter.levels?.length && !filter.levels.includes(entry.level)) {
      return false;
    }
    
    if (filter.sources?.length && !filter.sources.includes(entry.source)) {
      return false;
    }
    
    if (filter.contexts?.length &&
        (!entry.context || !filter.contexts.includes(entry.context))) {
      return false;
    }
    
    if (filter.tags?.length &&
        (!entry.tags || !filter.tags.some(tag => entry.tags.includes(tag)))) {
      return false;
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const sourceMatch = entry.source.toLowerCase().includes(searchLower);
      const contextMatch = entry.context ? entry.context.toLowerCase().includes(searchLower) : false;
      const dataMatch = entry.data ? JSON.stringify(entry.data).toLowerCase().includes(searchLower) : false;
      
      if (!(messageMatch || sourceMatch || contextMatch || dataMatch)) {
        return false;
      }
    }
    
    if (filter.startDate && new Date(entry.timestamp) < new Date(filter.startDate)) {
      return false;
    }
    
    if (filter.endDate && new Date(entry.timestamp) > new Date(filter.endDate)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Emit a new log entry to all subscribed clients
   */
  broadcastLogEntry(logEntry: LogEntry): void {
    // Get total logs count
    const totalCount = this.loggerService.getLogs().length;
    
    // For each client with an active filter
    this.activeFilters.forEach((filter, clientId) => {
      // Check if the log entry matches their filter
      if (this.logMatchesFilter(logEntry, filter)) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          const update: LogStreamUpdate = {
            log: logEntry,
            totalCount
          };
          client.emit('log-update', update);
        }
      }
    });
    
    // Also broadcast to all clients without filters
    this.server.emit('log-broadcast', {
      log: logEntry,
      totalCount
    });
  }
}
