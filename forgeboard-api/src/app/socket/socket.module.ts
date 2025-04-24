import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketRegistryService } from './socket-registry.service';
import { SocketLoggerService } from './socket-logger.service';

@Module({
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
