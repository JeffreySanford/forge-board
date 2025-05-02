import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { type LogEntry, type LogFilter, type LogQueryResponse, type SocketResponse, type LogStreamUpdate, type LogLevelEnum, type LogLevelString, stringToLogLevelEnum } from '@forge-board/shared/api-interfaces';
import { createSocketResponse } from '../utils/socket-utils';

@WebSocketGateway({
  namespace: '/logs',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class LoggerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(LoggerGateway.name);
  private activeFilters = new Map<string, LogFilter>();
  
  constructor(private loggerService: LoggerService) {}
  
  afterInit(server: Server): void {
    this.logger.log('Logger Gateway Initialized');
    // Store server reference if needed
    this.server = server;
  }
  
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }
  
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up client's filter when they disconnect
    this.activeFilters.delete(client.id);
  }
  
  @SubscribeMessage('filter-logs')
  handleFilterLogs(client: Socket, filter: LogFilter): WsResponse<SocketResponse<LogQueryResponse>> {
    this.logger.log(`Client ${client.id} set log filter: ${JSON.stringify(filter)}`);
    
    // Store client's filter
    this.activeFilters.set(client.id, filter);
    
    // Get filtered logs
    const logs = this.loggerService.getLogs(filter);
    const totalCount = this.loggerService.getLogs().length;
    
    // Return properly typed response
    return {
      event: 'logs',
      data: {
        status: 'success',
        data: {
          status: true,
          logs,
          totalCount,
          // Removed the 'total' property as it doesn't exist in LogQueryResponse
          timestamp: new Date().toISOString(),
          filtered: true
        },
        timestamp: new Date().toISOString()
      }
    };
  }
  
  @SubscribeMessage('subscribe-logs')
  handleSubscribe(client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to log stream`);
    
    // Client will now receive log updates via 'log-stream' events
  }

  @SubscribeMessage('update-filter')
  handleUpdateFilter(client: Socket, filter: LogFilter): void {
    this.logger.log(`Client ${client.id} updated log filter: ${JSON.stringify(filter)}`);
    
    // Update client's filter
    this.activeFilters.set(client.id, filter);
    
    // Get logs based on updated filter
    const logs = this.loggerService.getLogs(filter);
    const totalCount = this.loggerService.getLogs().length;
    
    // Send updated logs to client
    const update: LogStreamUpdate = {
      logs,
      totalCount,
      append: false
    };
    
    client.emit('log-stream', createSocketResponse('log-stream', update));
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
            totalCount,
            append: true
          };
          client.emit('log-stream', createSocketResponse('log-stream', update));
        }
      }
    });
    
    // Also broadcast to all clients without filters
    this.server.emit('new-log', createSocketResponse('new-log', logEntry));
  }
  
  /**
   * Check if a log entry matches a filter
   */
  private logMatchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (!filter) {
      return true;
    }
    
    // Check log level using the stringToLogLevelEnum function
    if (filter.level && Array.isArray(filter.level) && filter.level.length) {
      if (!filter.level.includes(entry.level)) {
        return false;
      }
    } else if (filter.level && !Array.isArray(filter.level)) {
      if (entry.level !== filter.level) {
        return false;
      }
    }
    
    // Check service property instead of sources
    if (filter.service && entry.source !== filter.service) {
      return false;
    }
    
    // Tags and contexts don't exist in LogFilter/LogEntry interfaces
    // Removed checks for non-existent properties
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const sourceMatch = entry.source && entry.source.toLowerCase().includes(searchLower);
      // Removed contexts check
      const dataMatch = entry.data ? JSON.stringify(entry.data).toLowerCase().includes(searchLower) : false;
      
      if (!(messageMatch || sourceMatch || dataMatch)) {
        return false;
      }
    }
    
    // Use standard date fields from the interface
    if (filter.startDate && new Date(entry.timestamp) < new Date(filter.startDate)) {
      return false;
    }
    
    if (filter.endDate && new Date(entry.timestamp) > new Date(filter.endDate)) {
      return false;
    }
    
    return true;
  }
}
