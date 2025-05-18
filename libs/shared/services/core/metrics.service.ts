// Shared MetricsService for both frontend and backend (framework-agnostic)
import { BehaviorSubject, Observable, Subscription, interval, Subject } from 'rxjs';
import { Metric } from '@forge-board/shared/api-interfaces';

/**
 * Shared logic for metrics data simulation and streaming.
 * This class is not decorated with Angular or NestJS decorators.
 * It can be extended or composed in framework-specific services.
 */
export class SharedMetricsService {
  protected metricsSubject = new BehaviorSubject<Metric>(this.generateMetrics());
  protected updateSubscription: Subscription | null = null;
  protected updateInterval = 3000;

  // Simulation state
  protected prevCpu = 50;
  protected prevMemory = 65;
  protected prevDisk = 55;
  protected prevNetwork = 30;
  protected cpuTrend = 0;
  protected memoryTrend = 0;
  protected simulatedLoad = 0;

  constructor() {}

  /**
   * Start or restart the metrics update timer
   */
  startMetricsTimer(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.updateSubscription = interval(this.updateInterval).subscribe(() => {
      const newMetrics = this.generateMetrics();
      this.metricsSubject.next(newMetrics);
    });
  }

  /**
   * Set the metrics update interval
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = Math.max(interval, 20);
    this.startMetricsTimer();
  }

  /**
   * Get the metrics stream as an observable
   */
  getMetrics(): Observable<Metric> {
    return this.metricsSubject.asObservable();
  }

  /**
   * Get the latest metrics value synchronously
   */
  getLatestMetricsValue(): Metric {
    return this.metricsSubject.getValue();
  }

  /**
   * Generate realistic metrics data with temporal correlation
   */
  protected generateMetrics(): Metric {
    // Simulate occasional load changes (10% chance)
    if (Math.random() < 0.1) {
      this.simulatedLoad = Math.min(100, Math.max(0, this.simulatedLoad + (Math.random() * 30 - 15)));
    }
    // Update trends (slowly shifting directions)
    if (Math.random() < 0.2) {
      this.cpuTrend = Math.min(5, Math.max(-5, this.cpuTrend + (Math.random() * 2 - 1)));
      this.memoryTrend = Math.min(2, Math.max(-1, this.memoryTrend + (Math.random() * 0.6 - 0.3)));
    }
    // CPU changes more rapidly but stays within realistic bounds
    const cpuDelta = (Math.random() * 3 - 1.5) + (this.cpuTrend * 0.5) + (this.simulatedLoad * 0.1);
    this.prevCpu = Math.min(95, Math.max(5, this.prevCpu + cpuDelta));
    // Memory tends to grow slowly and decline quickly (GC events)
    let memoryDelta = (Math.random() * 0.8 - 0.3) + (this.memoryTrend * 0.2);
    if (Math.random() < 0.05 && this.prevMemory > 70) {
      memoryDelta = -Math.random() * 8;
    }
    this.prevMemory = Math.min(98, Math.max(40, this.prevMemory + memoryDelta));
    // Disk and network change very little between readings
    const diskDelta = Math.random() * 0.6 - 0.3;
    this.prevDisk = Math.min(95, Math.max(20, this.prevDisk + diskDelta));
    const networkDelta = Math.random() * 5 - 2.5 + (this.simulatedLoad * 0.05);
    this.prevNetwork = Math.min(95, Math.max(1, this.prevNetwork + networkDelta));
    return {
      cpu: this.prevCpu,
      memory: this.prevMemory,
      disk: this.prevDisk,
      network: this.prevNetwork,
      time: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.metricsSubject.complete();
  }
}
