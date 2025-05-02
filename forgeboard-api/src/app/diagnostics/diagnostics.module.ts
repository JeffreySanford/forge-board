import { Module, forwardRef } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from '../gateways/diagnostics.gateway';
import { SocketModule } from '../socket/socket.module';
import { JwtDiagnosticsService } from './jwt-diagnostics.service';
import { JwtService } from '../auth/jwt.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SocketModule,
    forwardRef(() => AuthModule)
  ],
  controllers: [DiagnosticsController],
  providers: [
    DiagnosticsService,
    DiagnosticsGateway, // Add DiagnosticsGateway as a provider
    JwtDiagnosticsService, // Register JwtDiagnosticsService
    JwtService, // Register JwtService for DI
  ],
  exports: [
    DiagnosticsService,
    DiagnosticsGateway, // Export it so it can be used in other modules
    JwtDiagnosticsService, // Export JwtDiagnosticsService
    JwtService, // Export JwtService for use in other modules
  ],
})
export class DiagnosticsModule {}
