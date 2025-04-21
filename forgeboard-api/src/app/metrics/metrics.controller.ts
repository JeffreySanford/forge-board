import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('stream')
  getMetricsStream() {
    return this.metricsService.getMetrics(); // Ensure this returns valid data
  }

  @Get('set-interval')
  setUpdateInterval(@Query('interval') interval: number) {
    this.metricsService.setUpdateInterval(Number(interval));
    return { message: `Update interval set to ${interval}ms` };
  }
}
