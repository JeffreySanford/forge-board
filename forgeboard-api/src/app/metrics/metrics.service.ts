import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable, interval, Subscription, shareReplay } from 'rxjs';
import { MetricData } from '@forge-board/shared/api-interfaces';

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
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private updateInterval = 3000; // Default update interval of 3000ms
  
  /**
   * BehaviorSubject to track metrics state as a hot observable
   * Initialized with generated metrics and emits to all subscribers
   */
  private metricsSubject = new BehaviorSubject<MetricData>(this.generateMetrics());
  private updateSubscription: Subscription;
  
  // Previous values for smooth transitions
  private prevCpu = 50;
  private prevMemory = 65;
  private prevDisk = 55;
  private prevNetwork = 30;
  
  // Simulation parameters
  private cpuTrend = 0;
  private memoryTrend = 0;
  private simulatedLoad = 0;
  
  constructor() {
    this.logger.log('Metrics Service initialized with BehaviorSubject hot observable');
  }
  
  onModuleInit() {
    // Start the metrics update timer
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
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.metricsSubject.complete();
  }

  /**
   * Set the metrics update interval
   * @param interval The new interval in milliseconds
   * @returns Hot observable emitting the new interval
   */
  setUpdateInterval(interval: number): Observable<number> {
    // Ensure minimum interval is 20ms
    this.updateInterval = Math.max(interval, 20);
    this.logger.verbose(`Metrics update interval set to ${this.updateInterval}ms`);
    
    // Restart the timer with the new interval
    this.startMetricsTimer();
    
    // Return a hot observable with the new interval
    return new BehaviorSubject<number>(this.updateInterval).asObservable();
  }

  /**
   * Get the metrics stream as a hot observable
   * @returns Hot observable of MetricData that emits on each update
   */
  getMetrics(): Observable<MetricData> {
    // Return observable stream of metrics with replay to ensure consistent values
    return this.metricsSubject.asObservable().pipe(shareReplay(1));
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
    
    this.logger.log(`Starting metrics timer with ${this.updateInterval}ms interval`);
    
    // Create new interval subscription that updates metrics regularly
    this.updateSubscription = interval(this.updateInterval).subscribe(() => {
      const newMetrics = this.generateMetrics();
      this.metricsSubject.next(newMetrics);
      // this.logger.debug(`Generated new metrics at ${new Date().toISOString()}`);
    });
  }
  
  /**
   * Generate realistic metrics data with temporal correlation
   */
  private generateMetrics(): MetricData {
    // Simulate occasional load changes (10% chance)
    if (Math.random() < 0.1) {
      this.simulatedLoad = Math.min(100, Math.max(0, this.simulatedLoad + (Math.random() * 30 - 15)));
    }
    
    // Update trends (slowly shifting directions)
    if (Math.random() < 0.2) {
      this.cpuTrend = Math.min(5, Math.max(-5, this.cpuTrend + (Math.random() * 2 - 1)));
      this.memoryTrend = Math.min(2, Math.max(-1, this.memoryTrend + (Math.random() * 0.6 - 0.3)));
    }
    
    // Calculate new values with temporal correlation to previous values
    // CPU changes more rapidly but stays within realistic bounds
    const cpuDelta = (Math.random() * 3 - 1.5) + (this.cpuTrend * 0.5) + (this.simulatedLoad * 0.1);
    this.prevCpu = Math.min(95, Math.max(5, this.prevCpu + cpuDelta));
    
    // Memory tends to grow slowly and decline quickly (GC events)
    let memoryDelta = (Math.random() * 0.8 - 0.3) + (this.memoryTrend * 0.2);
    // Occasional memory drop (simulating garbage collection)
    if (Math.random() < 0.05 && this.prevMemory > 70) {
      memoryDelta = -Math.random() * 8;
    }
    this.prevMemory = Math.min(98, Math.max(40, this.prevMemory + memoryDelta));
    
    // Disk and network change very little between readings
    const diskDelta = Math.random() * 0.6 - 0.3;
    this.prevDisk = Math.min(95, Math.max(20, this.prevDisk + diskDelta));
    
    const networkDelta = Math.random() * 5 - 2.5 + (this.simulatedLoad * 0.05);
    this.prevNetwork = Math.min(95, Math.max(1, this.prevNetwork + networkDelta));
    
    const metrics = {
      time: new Date().toISOString(),
      cpu: Math.round(this.prevCpu * 10) / 10,
      memory: Math.round(this.prevMemory * 10) / 10,
      disk: Math.round(this.prevDisk * 10) / 10,
      network: Math.round(this.prevNetwork * 10) / 10
    };
    
    // Replace console.log with proper logger
    // this.logger.debug(`Generated new metrics at ${new Date().toISOString()}`, 'MetricsService');
    
    return metrics;
  }
}
