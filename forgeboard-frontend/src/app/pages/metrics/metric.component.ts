import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricData } from '@forge-board/shared/api-interfaces';
import { MetricsService } from '../../services/metrics.service';

@Component({
  selector: 'app-metric',
  templateUrl: './metric.component.html',
  styleUrls: ['./metric.component.scss'],
  standalone: false
})
export class MetricComponent implements OnInit {
  metrics$: Observable<MetricData>;
  refreshInterval: number = 500; // Default refresh interval in milliseconds

  constructor(private metricsService: MetricsService) {
    this.metrics$ = this.metricsService.getMetricsStream();
  }

  ngOnInit(): void {
    // Initialize component
  }

  /**
   * Handle interval change from the slider
   * @param event Input event from range slider
   */
  onIntervalChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.refreshInterval = value;
    
    // Update the metrics service with the new interval
    this.metricsService.setMetricsInterval(value).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Metrics interval updated to ${value}ms`);
        } else {
          console.warn('Failed to update metrics interval');
        }
      },
      error: (err) => {
        console.error('Error updating metrics interval:', err);
      }
    });
  }
}