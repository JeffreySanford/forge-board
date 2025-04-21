import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsGateway } from './gateways/metrics.gateways';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';

@Module({
  imports: [],
  controllers: [AppController, MetricsController], // Ensure MetricsController is registered
  providers: [AppService, MetricsGateway, MetricsService], // Ensure MetricsService is registered
})
export class AppModule {}
