import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private updateInterval = 1000; // Default update interval in milliseconds

  setUpdateInterval(interval: number) {
    this.updateInterval = Math.max(interval, 20); // Ensure minimum interval is 20ms
  }

  async getMetrics() {
    await new Promise((resolve) => setTimeout(resolve, this.updateInterval)); // Simulate delay
    return {
      time: new Date().toISOString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
    };
  }
}
