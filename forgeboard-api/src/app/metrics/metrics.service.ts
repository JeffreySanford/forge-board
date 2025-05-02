import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { MetricData } from '@forge-board/shared/api-interfaces';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private updateInterval = 1000; // Default update interval in milliseconds
  
  // Use BehaviorSubject to track metrics state
  private metricsSubject = new BehaviorSubject<MetricData>(this.generateMetrics());
  private updateSubscription: Subscription;
  
  constructor() {
    this.logger.log('Metrics Service initialized');
  }
  
  onModuleInit() {
    // Start the metrics update interval
    this.startMetricsTimer();
  }

  setUpdateInterval(interval: number): Observable<number> {
    // Ensure minimum interval is 20ms
    this.updateInterval = Math.max(interval, 20);
    this.logger.verbose(`Metrics update interval set to ${this.updateInterval}ms`);
    
    // Restart the timer with the new interval
    this.startMetricsTimer();
    
    return new BehaviorSubject<number>(this.updateInterval).asObservable();
  }

  getMetrics(): Observable<MetricData> {
    // Return observable stream of metrics
    return this.metricsSubject.asObservable();
  }
  
  /**
   * Get the latest metrics value synchronously
   */
  getLatestMetricsValue(): MetricData {
    return this.metricsSubject.getValue();
  }
  
  /**
   * Start or restart the metrics update timer
   */
  private startMetricsTimer(): void {
    // Clean up existing subscription if it exists
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    
    // Create new interval subscription that updates metrics regularly
    this.updateSubscription = interval(this.updateInterval).subscribe(() => {
      const newMetrics = this.generateMetrics();
      this.metricsSubject.next(newMetrics);
    });
  }
  
  /**
   * Generate random metrics
   */
  private generateMetrics(): MetricData {
    // Generate mock metric data
    const metrics: MetricData = {
      time: new Date().toISOString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    };
    
    return metrics;
  }
}
