import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics/metrics.module';
import { SocketModule } from './socket/socket.module';
import { StatusModule } from './status/status.module';
import { TilesModule } from './tiles/tiles.module';
import { MetricsGateway } from './gateways/metrics.gateways';
import { DiagnosticsGateway } from './gateways/diagnostics.gateway';
import { DiagnosticsController } from './diagnostics/diagnostics.controller';
import { DiagnosticsService } from './diagnostics/diagnostics.service';
import { SocketRegistryService } from './socket/socket-registry.service';
import { StatusController } from './controllers/status.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { TileStateController } from './tiles/tile-state.controller';
import { LoggerModule } from './logger/logger.module'; // Import LoggerModule
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { TileStateModule } from './tile-state/tile-state.module';
import { ConfigModule } from '@nestjs/config';
import { LogsController } from './logs/logs.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MetricsModule,
    SocketModule, // Add this module to imports
    StatusModule,
    TilesModule,
    LoggerModule, // Add LoggerModule
    DiagnosticsModule,
    TileStateModule
  ],
  controllers: [
    AppController,
    DiagnosticsController,
    StatusController,
    MetricsController,
    TileStateController,
    LogsController
  ],
  providers: [
    AppService,
    MetricsGateway,
    DiagnosticsGateway,
    DiagnosticsService,
    SocketRegistryService,
    MetricsService,
    {
      provide: Logger,
      useValue: new Logger('AppModule')
    }
  ],
})
export class AppModule {}
