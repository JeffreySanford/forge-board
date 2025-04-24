import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from '../gateways/diagnostics.gateway';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    SocketModule, // Import SocketModule to use SocketRegistryService
  ],
  controllers: [DiagnosticsController],
  providers: [
    DiagnosticsService,
    DiagnosticsGateway, // Add DiagnosticsGateway as a provider
  ],
  exports: [
    DiagnosticsService,
    DiagnosticsGateway, // Export it so it can be used in other modules
  ],
})
export class DiagnosticsModule {}
