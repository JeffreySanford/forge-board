import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable, interval, Subscription, shareReplay } from 'rxjs';
import { Metric } from '@forge-board/shared/api-interfaces';

/**
 * Service providing real-time system metrics via hot observables
 */
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private metrics$ = new BehaviorSubject<Metric[]>([]);
  private metricsHistory = new Map<string, Metric[]>();
  private timerSubscription?: Subscription;
  private updateInterval = 2000;
  
  // Cache previous values to generate realistic changes
  private prevCpu = 45;
  private prevMemory = 60;
  private prevDisk = 50;
  private prevNetwork = 25;

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
   * @returns Hot observable of metrics array
   */
  getMetrics(): Observable<Metric[]> {
    return this.metrics$.asObservable();
  }
  
  /**
   * Get current snapshot of metrics
   * @returns Current metrics array
   */
  getCurrentMetrics(): Metric[] {
    return this.metrics$.getValue();
  }
  
  /**
   * Start the metrics generation timer
   */
  private startMetricsTimer() {
    // Clear existing timer if any
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    // Start new timer
    this.timerSubscription = interval(this.updateInterval).subscribe(() => {
      this.generateMetrics();
    });
    
    // Generate initial metrics
    this.generateMetrics();
  }

  /**
   * Cleanup resources
   */
  private destroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * Generate realistic-looking metrics with smooth transitions
   */
  private generateMetrics() {
    const timestamp = new Date().toISOString();
    
    // Generate CPU with slight random fluctuation around previous value
    this.prevCpu = Math.min(Math.max(this.prevCpu + (Math.random() * 10 - 5), 5), 95);
    
    // Generate memory with slight random fluctuation
    this.prevMemory = Math.min(Math.max(this.prevMemory + (Math.random() * 6 - 3), 10), 90);
    
    // Generate disk with very small fluctuation
    this.prevDisk = Math.min(Math.max(this.prevDisk + (Math.random() * 2 - 1), 20), 95);
    
    // Generate network with more variability
    this.prevNetwork = Math.min(Math.max(this.prevNetwork + (Math.random() * 15 - 7.5), 5), 100);
    
    const metrics: Metric[] = [
      { name: 'cpu', value: this.prevCpu, timestamp, unit: '%', type: 'gauge' },
      { name: 'memory', value: this.prevMemory, timestamp, unit: '%', type: 'gauge' },
      { name: 'disk', value: this.prevDisk, timestamp, unit: '%', type: 'gauge' },
      { name: 'network', value: this.prevNetwork, timestamp, unit: 'mbps', type: 'gauge' }
    ];
    
    // Store in history
    metrics.forEach(metric => {
      if (!this.metricsHistory.has(metric.name)) {
        this.metricsHistory.set(metric.name, []);
      }
      
      const history = this.metricsHistory.get(metric.name)!;
      history.push(metric);
      
      // Limit history size
      if (history.length > 100) {
        this.metricsHistory.set(metric.name, history.slice(-100));
      }
    });
    
    // Update the behavior subject
    this.metrics$.next(metrics);
  }
}
