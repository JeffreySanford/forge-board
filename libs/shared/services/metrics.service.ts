// Base shared metrics service for use across the application
import { Metric } from '@forge-board/shared/api-interfaces';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { map, share, shareReplay } from 'rxjs/operators';

export class SharedMetricsService {
  protected metricsSubject = new BehaviorSubject<Metric[]>([]);
  protected updateInterval = 1000; // Default update interval in ms
  
  // Properties added to match existing implementation
  protected metrics$: Observable<Metric>;
  protected metricsSubscription: Subscription | null = null;
  protected running = false;

  // Simulated values (for demo purposes)
  protected prevCpu = 50;
  protected prevMemory = 65;
  protected prevDisk = 55;
  protected prevNetwork = 30;

  constructor() {
    // Initialize the metrics observable
    this.metrics$ = this.metricsSubject.pipe(
      map(metrics => metrics[0] || this.createEmptyMetric()),
      shareReplay(1)
    );
  }

  /**
   * Get the current metrics
   */
  getMetrics(): Observable<Metric> {
    return this.metrics$;
  }

  /**
   * Get the latest metrics value synchronously
   */
  getLatestMetricsValue(): Metric {
    const metrics = this.metricsSubject.getValue();
    return metrics[0] || this.createEmptyMetric();
  }

  /**
   * Add a metric to the collection
   */
  addMetric(metric: Metric): void {
    const metrics = [metric, ...this.metricsSubject.getValue().slice(0, 99)]; // Keep last 100 metrics
    this.metricsSubject.next(metrics);
  }

  /**
   * Update a metric in the collection
   */
  updateMetric(metric: Metric): void {
    const metrics = this.metricsSubject.getValue();
    const index = metrics.findIndex(m => 
      m.time === metric.time || 
      (m.cpu === metric.cpu && m.memory === metric.memory)
    );
    
    if (index >= 0) {
      metrics[index] = metric;
      this.metricsSubject.next([...metrics]);
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metricsSubject.next([]);
  }

  /**
   * Start sending metrics at regular intervals
   */
  startMetricsTimer(): void {
    // Clean up any existing subscriptions first
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
      this.metricsSubscription = null;
    }

    // Create new metrics subscription
    this.running = true;
    this.metricsSubscription = interval(this.updateInterval).subscribe(() => {
      const metric = this.generateMetric();
      this.metricsSubject.next([metric]);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
      this.metricsSubscription = null;
      this.running = false;
    }
  }

  /**
   * Generate simulated metrics data
   * Used for demo/testing purposes
   */
  protected generateMetric(): Metric {
    // Simulation logic for demo metrics - uses previous value to create realistic trend
    const cpuDelta = (Math.random() * 6) - 3; // -3 to +3 change
    const memoryDelta = (Math.random() * 4) - 2; // -2 to +2 change
    const diskDelta = (Math.random() * 2) - 0.5; // -0.5 to +1.5 change
    const networkDelta = (Math.random() * 8) - 4; // -4 to +4 change
    
    // Update values with bounds checking
    this.prevCpu = Math.max(5, Math.min(95, this.prevCpu + cpuDelta));
    this.prevMemory = Math.max(20, Math.min(90, this.prevMemory + memoryDelta));
    this.prevDisk = Math.max(30, Math.min(95, this.prevDisk + diskDelta));
    this.prevNetwork = Math.max(5, Math.min(80, this.prevNetwork + networkDelta));
    
    return {
      cpu: Math.round(this.prevCpu),
      memory: Math.round(this.prevMemory),
      time: new Date().toISOString(),
      disk: Math.round(this.prevDisk),
      network: Math.round(this.prevNetwork)
    };
  }

  /**
   * Create an empty metric object with default values
   */
  protected createEmptyMetric(): Metric {
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      time: new Date().toISOString()
    };
  }
}
