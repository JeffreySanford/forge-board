import { Component, OnInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics-service';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';

@Component({
  selector: 'app-metrics-indicator',
  templateUrl: './metrics-indicator.component.html',
  styleUrls: ['./metrics-indicator.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class MetricsIndicatorComponent implements OnInit {
  @Input() refreshInterval = 1000;
  @ViewChild('chart') chartContainer!: ElementRef;

  // Keep a small history of CPU & network data for ~30s at 1s intervals:
  cpuHistory: number[] = [];
  netHistory: number[] = [];
  private interval$ = new BehaviorSubject<number>(this.refreshInterval);
  metrics$!: Observable<{ cpu: number; memory: number; time: string }>;

  constructor(
    private renderer: Renderer2,
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

    setInterval(() => {
      const cpuVal = Math.floor(Math.random() * 100);
      const netVal = +(Math.random() * 2).toFixed(1); // e.g. MB
      this.cpuHistory.push(cpuVal);
      this.netHistory.push(netVal);

      // Keep last 30 data points
      if (this.cpuHistory.length > 30) this.cpuHistory.shift();
      if (this.netHistory.length > 30) this.netHistory.shift();

      this.drawChart();
    }, this.refreshInterval);
  }

  onIntervalChange(event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.refreshInterval = val;
    this.interval$.next(val);
    this.http
      .get(`http://localhost:3000/api/metrics/set-interval?interval=${val}`)
      .subscribe({
        next: (response) => console.log(response),
        error: (error) => console.error('Error setting interval:', error),
      });
  }

  drawChart() {
    // Use Renderer2 to select the chart element
    const chartEl = this.renderer.selectRootElement(this.chartContainer.nativeElement, true);
    // Clear any existing chart
    d3.select(chartEl).selectAll('*').remove();

    // Basic D3 setup
    const width = 220, height = 60;
    const svg = d3.select(chartEl)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const xScale = d3.scaleLinear()
      .domain([0, this.cpuHistory.length - 1])
      .range([0, width]);

    // Example: chart CPU usage
    const yScaleCPU = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const lineCPU = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScaleCPU(d));

    svg.append('path')
      .datum(this.cpuHistory)
      .attr('d', lineCPU)
      .attr('fill', 'none')
      .attr('stroke', 'lime')
      .attr('stroke-width', 1);

    // We could similarly plot netHistory on the same chart or another area
  }
}