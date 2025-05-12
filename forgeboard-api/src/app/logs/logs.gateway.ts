import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Subscription, firstValueFrom } from 'rxjs'; // Added firstValueFrom, removed Observable
import { LogEntry, createSocketResponse, LogFilter as SharedLogFilter } from '@forge-board/shared/api-interfaces'; // LogLevelEnum was correctly removed previously
import { LoggerService } from '../logger/logger.service'; // Backend LoggerService
import { SocketRegistryService } from '../socket/socket-registry.service'; // Optional: for logging connections

// Use the imported LogFilter from shared/api-interfaces
type LogFilter = SharedLogFilter;

@WebSocketGateway({
  namespace: '/logs',
  cors: {
    origin: '*',
    credentials: false
  }
})
export class LogGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer() server!: Server; // Added definite assignment assertion
  private readonly logger = new Logger(LogGateway.name);
  private activeClients = new Map<string, LogFilter>();
  private logSubscription!: Subscription;

  constructor(
    private readonly logsService: LoggerService, // Changed appLoggerService to logsService
    private readonly socketRegistry?: SocketRegistryService // Optional
  ) {
    this.logger.log('LogsGateway created');
  }

  afterInit(_server: Server) { // Prefixed server with _ as it's unused but required by interface
    this.logger.log('Logs WebSocket Gateway initialized');
    this.logger.verbose(`Server instance type: ${typeof _server}`); // Use _server to satisfy linter

    // Subscribe to new log batches from the backend LoggerService
    // Use the public observable batchedNewLogEntries$ from LoggerService
    if (this.logsService && this.logsService.batchedNewLogEntries$) {
       this.logSubscription = this.logsService.batchedNewLogEntries$.subscribe(
        (logBatch: LogEntry[]) => {
          if (logBatch && logBatch.length > 0) {
            this.logger.verbose(`Emitting log batch of ${logBatch.length} entries.`);
            this.server.emit('log-batch', createSocketResponse('log-batch', logBatch));
          }
        }
      );
    } else {
        this.logger.warn('Backend LoggerService does not expose batchedNewLogEntries$. Real-time log broadcasting will not work.');
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to logs: ${client.id}`);
    this.socketRegistry?.registerSocket(client, 'logs'); // Optional: register with a central registry
    
    // Set default filter
    this.activeClients.set(client.id, {
      level: undefined,
      service: '',
      limit: 100
    });

    // Optionally, send recent logs or a welcome message
    // client.emit('message', createSocketResponse('welcome', 'Connected to logs stream.'));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from logs: ${client.id}`);
    this.activeClients.delete(client.id);
    this.socketRegistry?.unregisterSocket(client.id, 'Client disconnected from logs'); // Corrected call
  }

  @SubscribeMessage('subscribe-logs')
  async handleSubscribe(client: Socket, filter?: LogFilter) { // Made async
    if (filter) {
      this.activeClients.set(client.id, filter);
    }
    
    // Emit initial data
    const logEntries = await firstValueFrom(this.logsService.getLogs(filter || {})); // Await log entries
    client.emit('log-stream', createSocketResponse('log-stream', { // Use createSocketResponse
        logs: logEntries, // Use resolved entries
        append: false
      }
    ));
    
    return createSocketResponse('subscribe-logs-ack', { subscribed: true, filterApplied: filter || this.activeClients.get(client.id) }); // Use createSocketResponse
  }

  @SubscribeMessage('update-filter')
  async handleUpdateFilter(client: Socket, filter: LogFilter) { // Made async
    this.activeClients.set(client.id, filter);
    
    // Get logs with updated filter
    const logEntries = await firstValueFrom(this.logsService.getLogs(filter)); // Await log entries
    client.emit('log-stream', createSocketResponse('log-stream', { // Use createSocketResponse
        logs: logEntries, // Use resolved entries
        append: false
      }
    ));
    
    return createSocketResponse('update-filter-ack', { filterApplied: filter }); // Use createSocketResponse
  }

  @SubscribeMessage('get-latest-logs')
  async handleGetLatest(client: Socket, options: { afterTimestamp?: string }) { // Made async
    const currentFilter = this.activeClients.get(client.id) || {};
    const filter = { 
      ...currentFilter,
      afterTimestamp: options?.afterTimestamp
    };
    
    const logEntries = await firstValueFrom(this.logsService.getLogs(filter)); // Await log entries
    client.emit('log-stream', createSocketResponse('log-stream', { // Use createSocketResponse
        logs: logEntries, // Use resolved entries
        append: true
      }
    ));
    
    return createSocketResponse('get-latest-logs-ack', { logsFetched: logEntries.length }); // Use createSocketResponse
  }
  
  // Method to broadcast a new log to all clients
  emitNewLog(log: LogEntry): void {
    this.server.emit('backend-log-entry', createSocketResponse('backend-log-entry', log)); // Use createSocketResponse
  }

  onModuleDestroy(): void {
    this.logger.log('Destroying LogsGateway.');
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }
}
