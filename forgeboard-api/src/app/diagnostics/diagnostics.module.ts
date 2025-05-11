import { Module, forwardRef } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from '../gateways/diagnostics.gateway';
import { SocketModule } from '../socket/socket.module';
import { JwtDiagnosticsService } from './jwt-diagnostics.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsModule } from '../metrics/metrics.module'; // Added MetricsModule import

@Module({
  imports: [
    SocketModule,
    forwardRef(() => AuthModule),
    MetricsModule, // Added MetricsModule
  ],
  controllers: [DiagnosticsController],
  providers: [
    DiagnosticsService,
    DiagnosticsGateway,
    JwtDiagnosticsService,
  ],
  exports: [
    DiagnosticsService,
    DiagnosticsGateway,
    JwtDiagnosticsService,
  ],
})
export class DiagnosticsModule {}
