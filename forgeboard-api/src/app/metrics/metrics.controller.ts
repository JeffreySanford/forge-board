import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import type { MetricData, MetricResponse } from '@forge-board/shared/api-interfaces';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);
  
  constructor(private readonly metricsService: MetricsService) {}
  
  @Get()
  getMetrics(): Observable<MetricData> {
    this.logger.log('GET /metrics');
    // Return the observable stream directly
    return this.metricsService.getMetrics();
  }
  
  @Get('status')
  getStatus(): Observable<{ status: string; timestamp: string }> {
    this.logger.log('GET /metrics/status');
    return of({
      status: 'online',
      timestamp: new Date().toISOString()
    });
  }
  
  @Get('set-interval')
  setInterval(@Query('interval') intervalStr: string): Observable<MetricResponse> {
    const interval = parseInt(intervalStr, 10);
    if (isNaN(interval) || interval < 20) {
      return of({
        success: false,
        status: 'error',
        data: null,
        timestamp: new Date().toISOString(),
        message: 'Invalid interval. Must be at least 20ms.'
      });
    }
    
    return this.metricsService.setUpdateInterval(interval).pipe(
      map(newInterval => ({
        success: true,
        status: 'success',
        data: null,
        timestamp: new Date().toISOString(),
        message: `Interval updated to ${newInterval}ms`
      }))
    );
  }

  @Post('register')
  registerMetric(@Body() metric: MetricData): Observable<MetricResponse> {
    // In a real application, you'd validate and store it
    return of({
      success: true,
      status: 'success',
      data: metric,
      timestamp: new Date().toISOString(),
      message: 'Metric data received'
    });
  }
}
