import { Controller, Get, Param } from '@nestjs/common';
import { SocketRegistryService } from '../socket/socket-registry.service';
import { SocketLoggerService } from '../socket/socket-logger.service';
import { SocketInfo, SocketMetrics, SocketLogEvent } from '@forge-board/shared/api-interfaces';

@Controller('sockets')
export class SocketController {
  constructor(
    private readonly socketRegistry: SocketRegistryService,
    private readonly socketLogger: SocketLoggerService
  ) {}

  @Get()
  getSocketStatus(): { activeSockets: SocketInfo[], metrics: SocketMetrics } {
    return {
      activeSockets: this.socketRegistry.getActiveSockets(),
      metrics: this.socketRegistry.getMetrics()
    };
  }

  @Get('logs')
  getSocketLogs(): SocketLogEvent[] {
    return this.socketLogger.getLogs(100).map(log => ({
      socketId: log.socketId,
      namespace: log.namespace,
      eventType: log.eventType, // Use eventType, not type
      timestamp: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
      message: log.message,
      data: log.data
    }));
  }

  @Get(':id')
  getSocketDetails(@Param('id') id: string): SocketInfo | undefined {
    // Fix: Use getSocketInfo method instead of getSocketById
    return this.socketRegistry.getActiveSockets().find(socket => socket.id === id);
  }
}
