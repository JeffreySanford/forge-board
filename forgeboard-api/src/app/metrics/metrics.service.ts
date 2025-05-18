import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable, interval, Subscription, shareReplay } from 'rxjs';
import { Metric } from '@forge-board/shared/api-interfaces';
import { SharedMetricsService } from '@forge-board/shared/services/metrics.service';

/**
 * Service providing real-time system metrics via hot observables
 * 
 * Features:
 * - Continuously updated metrics via BehaviorSubject (hot observable)
 * - Configurable update interval
 * - Realistic data simulation with temporal correlation
 * 
 * @example
 * // Subscribe to the metrics stream
 * metricsService.getMetrics().subscribe(metrics => {
 *   console.log(`CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%`);
 * });
 * 
 * // Change the update interval
 * metricsService.setUpdateInterval(1000).subscribe(interval => {
 *   console.log(`Metrics now updating every ${interval}ms`);
 * });
 */
@Injectable()
export class MetricsService extends SharedMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);

  constructor() {
    super();
    this.logger.log('Metrics Service initialized with SharedMetricsService');
  }

  onModuleInit() {
    this.startMetricsTimer();
    // Initialize with semi-random but realistic values
    this.prevCpu = 45 + Math.random() * 15;
    this.prevMemory = 60 + Math.random() * 10;
    this.prevDisk = 50 + Math.random() * 10;
    this.prevNetwork = 25 + Math.random() * 10;
  }

  /**
   * Clean up resources when the module is destroyed
   */
  onModuleDestroy() {
    this.logger.log('MetricsService cleaning up resources');
    this.destroy();
  }

  /**
   * Set the metrics update interval
   * @param interval The new interval in milliseconds
   * @returns Hot observable emitting the new interval
   */
  setUpdateInterval(interval: number): Observable<number> {
    this.updateInterval = Math.max(interval, 20);
    this.logger.verbose(`Metrics update interval set to ${this.updateInterval}ms`);
    
    // Restart the timer with the new interval
    this.startMetricsTimer();
    
    // Return a hot observable with the new interval
    return new BehaviorSubject<number>(this.updateInterval).asObservable();
  }

  /**
   * Get the metrics stream as a hot observable
   * @returns Hot observable of Metric that emits on each update
   */
  getMetrics(): Observable<Metric> {
    return super.getMetrics();
  }
  
  /**
   * Get the latest metrics value synchronously
   */
  getLatestMetricsValue(): Metric {
    return super.getLatestMetricsValue();
  }
}
