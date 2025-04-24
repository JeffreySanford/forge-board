import { Injectable, Logger } from '@nestjs/common';
import { MetricData } from '@forge-board/shared/api-interfaces';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private updateInterval = 1000; // Default update interval in milliseconds
  private latestMetrics: MetricData;
  
  constructor() {
    this.logger.log('Metrics Service initialized');
    // Initialize with default data
    this.latestMetrics = this.generateMetrics();
    
    // Update metrics periodically
    setInterval(() => {
      this.latestMetrics = this.generateMetrics();
    }, 1000);
  }

  setUpdateInterval(interval: number) {
    // Ensure minimum interval is 20ms
    this.updateInterval = Math.max(interval, 20);
    this.logger.verbose(`Metrics update interval set to ${this.updateInterval}ms`);
  }

  async getMetrics(): Promise<MetricData> {
    // Return the latest metrics (cache)
    return this.latestMetrics;
  }
  
  /**
   * Get the latest metrics without waiting
   */
  getLatestMetrics(): MetricData {
    return this.latestMetrics;
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
