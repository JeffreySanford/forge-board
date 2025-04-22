import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MetricsService } from '../../../services/metrics.service';
import { MetricData } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-metrics-infographic',
  templateUrl: './metrics-infographic.component.html',
  styleUrls: ['./metrics-infographic.component.scss'],
  standalone: false
})
export class MetricsInfographicComponent implements OnInit {
  // Default update interval in milliseconds
  updateInterval = 500;
  // BehaviorSubject to change the interval dynamically
  interval$ = new BehaviorSubject<number>(this.updateInterval);
  // Observable that emits the latest metrics data
  metrics$!: Observable<MetricData>;

  constructor(
    private metricsService: MetricsService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.metrics$ = this.interval$.pipe(
      switchMap(interval =>
        timer(0, interval).pipe(
          switchMap(() =>
            this.metricsService.getMetricsStream().pipe(
              catchError(err => {
                console.error('Polling stream error:', err);
                // supply fallback so UI stays responsive
                return of({ cpu: NaN, memory: NaN, time: new Date().toISOString() });
              })
            )
          )
        )
      )
    );
  }

  onIntervalChange(event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.updateInterval = val;
    this.interval$.next(val);
    this.http
      .get(`http://localhost:3000/api/metrics/set-interval?interval=${val}`)
      .subscribe({
        next: (response) => console.log(response),
        error: (error) => console.error('Error setting interval:', error),
      });
  }
}
