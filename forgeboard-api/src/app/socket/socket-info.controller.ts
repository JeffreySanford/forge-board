import { Controller, Get, Logger } from '@nestjs/common';
import { SocketRegistryService } from './socket-registry.service';
import { SocketInfo, SocketInfoDto } from '@forge-board/shared/api-interfaces'; 
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('sockets')
@Controller('api/sockets')
export class SocketInfoController {
  private readonly logger = new Logger(SocketInfoController.name);

  constructor(private readonly socketRegistryService: SocketRegistryService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active socket connections' })
  @ApiResponse({ status: 200, description: 'A list of active socket connections.', type: [SocketInfoDto] }) 
  getActiveSockets() { 
    this.logger.log('Request received for active sockets');
    try {
      const activeSockets = this.socketRegistryService.getActiveSockets();
      this.logger.log(`Returning ${activeSockets.length} active sockets.`);
      
      // Return array directly for consistent format
      return activeSockets.map(socket => ({
        id: socket.id,
        namespace: socket.namespace,
        clientIp: socket.clientIp,
        userAgent: socket.userAgent,
        connectTime: socket.connectTime,
        disconnectTime: socket.disconnectTime,
        lastActivity: socket.lastActivity,
        events: socket.events || []
      }));
    } catch (error) {
      this.logger.error(`Error retrieving active sockets: ${error.message}`, error.stack);
      // Return an empty array instead of throwing - prevents 500 errors
      return [];
    }
  }
}
