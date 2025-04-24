import { Injectable, Logger } from '@nestjs/common';

interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: any;
}

@Injectable()
export class SocketLoggerService {
  private readonly logger = new Logger(SocketLoggerService.name);
  private logs: SocketLogEvent[] = [];
  private readonly maxLogEntries = 1000;

  constructor() {
    this.logger.log('Socket Logger Service initialized');
  }

  log(socketId: string, namespace: string, eventType: string, message: string, data?: any): void {
    const logEntry: SocketLogEvent = {
      socketId,
      namespace,
      eventType,
      timestamp: new Date(),
      message,
      data
    };

    this.logs.unshift(logEntry);
    
    // Trim logs if they exceed max length
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries);
    }

    // Also log to the standard logger
    this.logger.verbose(
      `Socket ${socketId} (${namespace}): ${eventType} - ${message}`,
      data ? JSON.stringify(data) : undefined
    );
  }

  /**
   * Get all logs with optional limit
   * @param limit Maximum number of logs to return (default: 100)
   * @returns Array of log events
   */
  getLogs(limit: number = 100): SocketLogEvent[] {
    return this.logs.slice(0, limit);
  }

  getLogsBySocketId(socketId: string): SocketLogEvent[] {
    return this.logs.filter(log => log.socketId === socketId);
  }

  clearLogs(): void {
    this.logs = [];
    this.logger.verbose('Socket logs cleared');
  }
}
