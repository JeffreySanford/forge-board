import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketRegistryService } from './socket-registry.service';
import { SocketLoggerService } from './socket-logger.service';
import { SocketInfoController } from './socket-info.controller'; // Import the new controller

@Module({
  controllers: [SocketInfoController], // Add the controller
  providers: [
    SocketGateway,
    SocketRegistryService,
    SocketLoggerService
  ],
  exports: [
    SocketGateway,
    SocketRegistryService,
    SocketLoggerService
  ],
})
export class SocketModule {}
