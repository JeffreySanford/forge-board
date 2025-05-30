import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Subscription, interval } from 'rxjs';
import * as d3 from 'd3';
import { MetricData } from '@forge-board/shared/api-interfaces';
import { MetricsService } from '../../../../services/metrics.service';
import { Tile } from '@forge-board/shared/api-interfaces';

// Define proper interfaces for our component
interface HealthData {
  category: string;
  score: number;
  threshold: number;
  icon: string;
  details?: Record<string, unknown>;
}

@Component({
  selector: 'app-system-health',
  templateUrl: './system-health.component.html',
  styleUrls: ['./system-health.component.scss'],
  standalone: false,
})
export class SystemHealthComponent implements OnInit, OnDestroy, Tile {
  @ViewChild('chart') private chartContainer!: ElementRef;

  // Tile interface implementation
  position: number = 0;
  id: string = 'system-health';
  type: 'health' = 'health';
  title = 'System Health';
  order: number = 1;
  visible: boolean = true;

  // Add row and col for Tile interface
  row = 0;
  col = 0;

  subtitle = 'Overall status monitor';
  icon = 'health_and_safety';
  loading = true;

  private subscription = new Subscription();

  overallHealth = 0;
  statusMessage = 'Checking system...';
  lastIncidentTime = '-- minutes ago';
  serverUptime = '00:00:00';

  healthData: HealthData[] = [];

  constructor(private metricsService: MetricsService) {
    // Initialize with default health categories
    this.healthData = [
      { category: 'CPU', score: 0, threshold: 80, icon: 'memory' },
      { category: 'Memory', score: 0, threshold: 90, icon: 'sd_card' },
      { category: 'Disk', score: 0, threshold: 90, icon: 'storage' },
      { category: 'Network', score: 0, threshold: 70, icon: 'wifi' },
    ];
  }

  ngOnInit(): void {
    this.subscription.add(
      this.metricsService.getMetricsStream().subscribe((metrics) => {
        this.loading = false;

        // Update health data based on metrics
        this.updateHealthData(metrics);

        // Calculate overall health score (weighted average)
        this.calculateOverallHealth();
      })
    );

    // Simulate server uptime increasing
    let uptimeSeconds = 0;
    this.subscription.add(
      interval(1000).subscribe(() => {
        uptimeSeconds++;
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        this.serverUptime = `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Simulate a random incident
        if (Math.random() < 0.001) {
          // Very rare chance
          const minutesAgo = Math.floor(Math.random() * 30) + 1;
          this.lastIncidentTime = `${minutesAgo} minute${
            minutesAgo > 1 ? 's' : ''
          } ago`;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  refresh(): void {
    this.loading = true;
    setTimeout(() => (this.loading = false), 500);
  }

  /**
   * Get CSS class based on health score
   */
  getHealthClass(): string {
    if (this.overallHealth >= 90) {
      return 'healthy';
    } else if (this.overallHealth >= 70) {
      return 'good';
    } else if (this.overallHealth >= 50) {
      return 'moderate';
    } else if (this.overallHealth >= 30) {
      return 'degraded';
    } else {
      return 'critical';
    }
  }

  /**
   * Get CSS class for metric health status
   */
  getMetricHealthClass(score: number, threshold: number): string {
    if (score >= threshold) {
      return 'critical';
    } else if (score >= threshold * 0.8) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Update the health data using metrics
   */
  private updateHealthData(metrics: MetricData): void {
    // Update CPU health
    const cpuIndex = this.healthData.findIndex((d) => d.category === 'CPU');
    if (cpuIndex >= 0 && metrics.cpu !== undefined) {
      this.healthData[cpuIndex].score = metrics.cpu;
    }

    // Update Memory health
    const memIndex = this.healthData.findIndex((d) => d.category === 'Memory');
    if (memIndex >= 0 && metrics.memory !== undefined) {
      this.healthData[memIndex].score = metrics.memory;
    }

    // Update Disk health
    const diskIndex = this.healthData.findIndex((d) => d.category === 'Disk');
    if (diskIndex >= 0 && metrics.disk !== undefined) {
      this.healthData[diskIndex].score = metrics.disk;
    }

    // Update Network health
    const netIndex = this.healthData.findIndex((d) => d.category === 'Network');
    if (netIndex >= 0 && metrics.network !== undefined) {
      this.healthData[netIndex].score = metrics.network;
    }
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(): void {
    // Simple weighted average
    const weights = {
      CPU: 0.3,
      Memory: 0.3,
      Disk: 0.2,
      Network: 0.2,
    };

    let totalScore = 0;
    let totalWeight = 0;

    this.healthData.forEach((data) => {
      const weight = weights[data.category as keyof typeof weights] || 0.25;
      totalScore += (100 - data.score) * weight; // Invert score (higher usage = lower health)
      totalWeight += weight;
    });

    this.overallHealth = Math.round(totalScore / totalWeight);

    // Set status message based on health score
    if (this.overallHealth >= 90) {
      this.statusMessage = 'System operating normally';
    } else if (this.overallHealth >= 70) {
      this.statusMessage = 'System health good';
    } else if (this.overallHealth >= 50) {
      this.statusMessage = 'System under moderate load';
    } else if (this.overallHealth >= 30) {
      this.statusMessage = 'System health degraded';
    } else {
      this.statusMessage = 'System health critical';
    }
  }
}
