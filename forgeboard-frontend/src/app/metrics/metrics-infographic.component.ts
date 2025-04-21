import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { MetricsService } from './metrics-service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-metrics-infographic',
  templateUrl: './metrics-infographic.component.html',
  styleUrls: ['./metrics-infographic.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class MetricsInfographicComponent implements OnInit {
  updateInterval = 1000;
  private interval$ = new BehaviorSubject<number>(this.updateInterval);
  metrics$!: Observable<{ cpu: number; memory: number; time: string }>;

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
    
    // Replace direct subscribe with pipe for more consistent RxJS approach
    this.http
      .get(`http://localhost:3000/api/metrics/set-interval?interval=${val}`)
      .pipe(
        tap(response => console.log('Interval updated:', response)),
        catchError(error => {
          console.error('Error setting interval:', error);
          return of(null);
        })
      )
      .subscribe();
  }
}