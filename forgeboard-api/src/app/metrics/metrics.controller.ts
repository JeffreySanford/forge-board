import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricData, MetricResponse } from '@forge-board/shared/api-interfaces';

@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);
  
  constructor(private readonly metricsService: MetricsService) {}
  
  @Get()
  async getMetrics(): Promise<MetricData> {
    this.logger.log('GET /metrics');
    return this.metricsService.getMetrics();
  }
  
  @Get('status')
  getStatus(): { status: string; timestamp: string } {
    this.logger.log('GET /metrics/status');
    return {
      status: 'online',
      timestamp: new Date().toISOString()
    };
  }
  
  @Get('set-interval')
  setInterval(@Query('interval') intervalStr: string): MetricResponse {
    const interval = parseInt(intervalStr, 10);
    if (isNaN(interval) || interval < 20) {
      return {
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        message: 'Invalid interval. Must be at least 20ms.'
      };
    }
    this.metricsService.setUpdateInterval(interval);
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
      message: `Interval updated to ${interval}ms`
    };
  }

  registerMetric(@Body() metric: MetricData): MetricResponse {
    // In a real application, you'd validate and store it
    return {
      success: true,
      data: metric,
      timestamp: new Date().toISOString(),
      message: 'Metric data received'
    };
  }
}
