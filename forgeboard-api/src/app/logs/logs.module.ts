import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogGateway } from './logs.gateway';
import { SocketModule } from '../socket/socket.module'; // Ensure SocketModule is imported

@Module({
  imports: [
    SocketModule // Add SocketModule here
  ],
  controllers: [LogsController],
  providers: [LogsService, LogGateway],
  exports: [LogsService]
})
export class LogsModule {}
