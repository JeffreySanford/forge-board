import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsGateway } from './gateways/metrics.gateways';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { TileStateController } from './tile-state/tile-state.controller';
import { DiagnosticsController } from './diagnostics/diagnostics.controller';
import { TileStateService } from './tile-state/tile-state.service';
import { DiagnosticsService } from './diagnostics/diagnostics.service';
import { DiagnosticsGateway } from './gateways/diagnostics.gateway';

@Module({
  imports: [],
  controllers: [
    AppController,
    MetricsController,
    DiagnosticsController,
    TileStateController
  ],
  providers: [
    AppService,
    MetricsGateway,
    MetricsService,
    DiagnosticsService,
    TileStateService,
    DiagnosticsGateway
  ],
})
export class AppModule {}
