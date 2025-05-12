import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LoggerService } from './logger.service';
import type { LogFilter } from '@forge-board/shared/api-interfaces';
import { LogEntry, LogQueryResponse, LogStreamUpdate, createSocketResponse } from '@forge-board/shared/api-interfaces';
import { firstValueFrom } from 'rxjs';

// Define a proper Socket Error class
class SocketError extends Error {
  readonly status: string = 'error';
  readonly timestamp: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SocketError';
    this.timestamp = new Date().toISOString();
    this.details = details;
  }

  // Convert to a plain object suitable for socket transmission
  toPlainObject() {
    return {
      status: this.status,
      message: this.message,
      name: this.name,
      timestamp: this.timestamp,
      details: this.details
    };
  }
}

@WebSocketGateway({
  namespace: '/logs',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class LoggerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('LoggerGateway');
  private activeFilters = new Map<string, LogFilter>();

  constructor(private readonly loggerService: LoggerService) {}

  onModuleInit() {
    // Subscribe to new log entries from LoggerService
    this.loggerService.newLogEntry$.subscribe(logEntry => {
      this.broadcastLogEntry(logEntry);
    });
  }
  
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
  handleFilterLogs(client: Socket, filter: LogFilter) {
    this.logger.log(`Client ${client.id} set log filter: ${JSON.stringify(filter)}`);
    
    // Store client's filter
    this.activeFilters.set(client.id, filter);
    
    // Get filtered logs with observable pattern
    const logs$ = this.loggerService.getLogs(filter);
    
    // We need to get totalCount from all logs, but convert to value first
    firstValueFrom(this.loggerService.getLogs({}))
      .then(allLogs => {
        const totalCount = allLogs.length;
        
        // Now get the filtered logs
        firstValueFrom(logs$)
          .then(filteredLogs => {
            // Return properly typed response
            const response: LogQueryResponse = {
              status: true,
              logs: filteredLogs,
              totalCount,
              filtered: true,
              timestamp: new Date().toISOString()
            };
            
            client.emit('logs', {
              status: 'success',
              data: response
            });
          })
          .catch(error => {
            this.handleError(client, 'Error retrieving filtered logs', error);
          });
      })
      .catch(error => {
        this.handleError(client, 'Error counting total logs', error);
      });
  }
  
  @SubscribeMessage('subscribe-logs')
  handleSubscribe(client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to log stream`);
    
    // Client will now receive log updates via 'log-stream' events
  }

  @SubscribeMessage('update-filter')
  async handleUpdateFilter(client: Socket, filter: LogFilter) {
    try {
      this.logger.debug(`Client ${client.id} updated filter: ${JSON.stringify(filter)}`);
      
      // Store the filter for this client
      this.activeFilters.set(client.id, filter);
      
      // Get logs based on updated filter
      const logs = await firstValueFrom(this.loggerService.getLogs(filter));
      const allLogs = await firstValueFrom(this.loggerService.getLogs({}));
      const totalCount = allLogs.length;

      // Send updated logs to client
      const update: LogStreamUpdate = {
        logs,
        totalCount,
        append: false
      };
      
      client.emit('log-stream', createSocketResponse('log-stream', update));
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error updating filter', error);
      return { success: false, error: error.message };
    }
  }
  
  @SubscribeMessage('get-latest-logs')
  async handleGetLatestLogs(client: Socket, options: { afterTimestamp?: string }) {
    try {
      const filter: LogFilter = this.activeFilters.get(client.id) || {};
      if (options.afterTimestamp) {
        filter.afterTimestamp = options.afterTimestamp;
      }

      // Get filtered logs
      const logs = await firstValueFrom(this.loggerService.getLogs(filter));
      const allLogs = await firstValueFrom(this.loggerService.getLogs({}));
      const totalCount = allLogs.length;

      // Return properly typed response
      return createSocketResponse<LogQueryResponse>('logs', {
        status: true,
        logs,
        totalCount,
        filtered: Object.keys(filter).length > 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Error fetching logs', error);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Emit a new log entry to all subscribed clients
   */
  async broadcastLogEntry(logEntry: LogEntry) {
    try {
      // Skip if the log entry is about log processing itself to avoid loops
      if (this.isLogProcessingLog(logEntry)) {
        return;
      }

      // Get total logs count
      const allLogs = await firstValueFrom(this.loggerService.getLogs({}));
      const totalCount = allLogs.length;

      // For each client with an active filter
      this.activeFilters.forEach(async (filter, clientId) => {
        // Check if this log entry matches the client's filter
        if (this.logMatchesFilter(logEntry, filter)) {
          const client = this.server.sockets.sockets.get(clientId);
          if (client) {
            // Send just this single log with append flag
            client.emit('log-stream', createSocketResponse('log-stream', {
              log: logEntry,
              totalCount,
              append: true
            }));
          }
        }
      });
      
      // Also broadcast to all clients without filters - with renamed event name
      this.server.emit('backend-log-entry', createSocketResponse('backend-log-entry', logEntry));
    } catch (error) {
      this.logger.error('Error broadcasting log entry', error);
    }
  }

  /**
   * Handle errors in gateway methods and send appropriate error responses to clients
   * @param client The Socket client that experienced the error
   * @param message A descriptive error message
   * @param error The original error object
   */
  private handleError(client: Socket, message: string, error: unknown): void {
    // Create a proper SocketError instance
    const socketError = error instanceof SocketError 
      ? error 
      : new SocketError(
          message,
          error instanceof Error 
            ? { name: error.name, message: error.message } 
            : { details: String(error) }
        );
    
    // Log the error details for server-side troubleshooting
    this.logger.error(
      `Socket error: ${socketError.message}`, 
      error instanceof Error ? error.stack : JSON.stringify(error)
    );
    
    // Send the formatted error response to the client
    client.emit('error', socketError.toPlainObject());
  }

  /**
   * Check if a log entry is about log processing itself
   */
  private isLogProcessingLog(log: LogEntry): boolean {
    // Detect logs about logging to prevent loops
    const loggingKeywords = [
      'received log', 'processing log', 'log stream', 
      'log filter', 'log updated', 'logger service'
    ];
    
    // Check if message contains logging keywords
    const messageHasLoggingKeywords = loggingKeywords.some(keyword => 
      log.message?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if source is related to logging
    const isLoggerSource = log.source?.toLowerCase().includes('log') || 
                          log.source?.toLowerCase().includes('socket');
    
    return messageHasLoggingKeywords && isLoggerSource;
  }
  
  /**
   * Check if a log entry matches a filter
   */
  private logMatchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (!filter) {
      return true;
    }
    
    // Check log level (entry.level and filter.level are LogLevelEnum)
    if (filter.level && Array.isArray(filter.level) && filter.level.length) {
      if (!filter.level.includes(entry.level)) {
        return false;
      }
    } else if (filter.level && !Array.isArray(filter.level)) {
      if (entry.level !== filter.level) { // Direct enum comparison
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
      
      if (!(messageMatch || sourceMatch)) {
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
