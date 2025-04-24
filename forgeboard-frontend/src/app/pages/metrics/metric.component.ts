import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MetricData } from '@forge-board/shared/api-interfaces';
import { MetricsService } from '../../services/metrics.service';
import { BackendStatusService } from '../../services/backend-status.service';

@Component({
  selector: 'app-metric',
  templateUrl: './metric.component.html',
  styleUrls: ['./metric.component.scss'],
  standalone: false
})
export class MetricComponent implements OnInit, OnDestroy, AfterViewInit {
  metrics$: Observable<MetricData>;
  refreshInterval: number = 500; // Default refresh interval in milliseconds
  chartData: number[] = [];
  memoryData: number[] = [];
  maxDataPoints = 30;
  chartInitialized = false;
  usingMockData = false;
  isTransitioning = false; // Add a flag to track transitions
  
  @ViewChild('chart') chartElement!: ElementRef<HTMLDivElement>;
  private subscription = new Subscription();
  
  constructor(
    private metricsService: MetricsService,
    private backendStatusService: BackendStatusService
  ) {
    this.metrics$ = this.metricsService.getMetricsStream();
    
    // Pre-fill chart data with zeros
    this.chartData = Array(this.maxDataPoints).fill(0);
    this.memoryData = Array(this.maxDataPoints).fill(0);
  }

  ngOnInit(): void {
    // Initialize component
    console.log('Metric component initialized');
    
    // Subscribe to metrics stream to update chart data
    this.subscription.add(
      this.metrics$.subscribe(metrics => {
        if (metrics) {
          // Add new data point to chart arrays
          this.chartData.push(metrics.cpu);
          this.chartData = this.chartData.slice(-this.maxDataPoints);
          
          this.memoryData.push(metrics.memory);
          this.memoryData = this.memoryData.slice(-this.maxDataPoints);
          
          if (this.chartInitialized) {
            this.updateChart();
          }
        }
      })
    );
    
    // Subscribe to backend status to check if we're using mock data
    this.subscription.add(
      this.backendStatusService.getStatus().subscribe(status => {
        this.usingMockData = status.anyMockData;
      })
    );

    // Subscribe to mock data status directly from the metrics service
    this.subscription.add(
      this.metricsService.getMockDataStatus().subscribe(isMockData => {
        if (this.usingMockData !== isMockData) {
          // Only animate if there's an actual change
          this.isTransitioning = true;
          
          // Set a delay to allow animations to complete
          setTimeout(() => {
            this.usingMockData = isMockData;
            
            // Reset transition state after animation completes
            setTimeout(() => {
              this.isTransitioning = false;
            }, 700); // Animation duration
          }, 300); // Slight delay before changing status
        }
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    setTimeout(() => {
      this.initializeChart();
      this.chartInitialized = true;
    }, 500);
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
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
  
  private initializeChart(): void {
    if (!this.chartElement) return;
    
    // Create SVG element for chart
    const chartWidth = this.chartElement.nativeElement.clientWidth;
    const chartHeight = this.chartElement.nativeElement.clientHeight;
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('metrics-chart');
    
    // Add grid lines
    for (let i = 0; i < 5; i++) {
      const y = chartHeight * (i / 4);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('x2', String(chartWidth));
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
      line.setAttribute('stroke-dasharray', '4 4');
      svg.appendChild(line);
      
      // Add percentage label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '5');
      text.setAttribute('y', String(y - 5));
      text.setAttribute('fill', 'rgba(255, 255, 255, 0.5)');
      text.setAttribute('font-size', '10');
      text.textContent = `${100 - (i * 25)}%`;
      svg.appendChild(text);
    }
    
    // Create CPU polyline
    const cpuPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    cpuPolyline.setAttribute('stroke', '#4eff91');
    cpuPolyline.setAttribute('stroke-width', '2');
    cpuPolyline.setAttribute('fill', 'none');
    cpuPolyline.id = 'cpu-line';
    svg.appendChild(cpuPolyline);
    
    // Create Memory polyline
    const memoryPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    memoryPolyline.setAttribute('stroke', '#ffe066');
    memoryPolyline.setAttribute('stroke-width', '2');
    memoryPolyline.setAttribute('fill', 'none');
    memoryPolyline.setAttribute('stroke-dasharray', '4 2');
    memoryPolyline.id = 'memory-line';
    svg.appendChild(memoryPolyline);
    
    // Add legend
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('transform', `translate(${chartWidth - 100}, 20)`);
    
    // CPU legend item
    const cpuRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cpuRect.setAttribute('width', '15');
    cpuRect.setAttribute('height', '3');
    cpuRect.setAttribute('fill', '#4eff91');
    legend.appendChild(cpuRect);
    
    const cpuText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    cpuText.setAttribute('x', '20');
    cpuText.setAttribute('y', '5');
    cpuText.setAttribute('fill', '#ffffff');
    cpuText.setAttribute('font-size', '12');
    cpuText.textContent = 'CPU';
    legend.appendChild(cpuText);
    
    // Memory legend item
    const memRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    memRect.setAttribute('y', '15');
    memRect.setAttribute('width', '15');
    memRect.setAttribute('height', '3');
    memRect.setAttribute('fill', '#ffe066');
    legend.appendChild(memRect);
    
    const memText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    memText.setAttribute('x', '20');
    memText.setAttribute('y', '20');
    memText.setAttribute('fill', '#ffffff');
    memText.setAttribute('font-size', '12');
    memText.textContent = 'MEM';
    legend.appendChild(memText);
    
    svg.appendChild(legend);
    
    // Add SVG to DOM
    this.chartElement.nativeElement.appendChild(svg);
    
    // Initial update
    this.updateChart();
  }
  
  private updateChart(): void {
    if (!this.chartElement) return;
    
    const chartWidth = this.chartElement.nativeElement.clientWidth;
    const chartHeight = this.chartElement.nativeElement.clientHeight;
    
    const cpuLine = document.getElementById('cpu-line');
    const memoryLine = document.getElementById('memory-line');
    
    if (!cpuLine || !memoryLine) return;
    
    // Generate points for CPU line
    const cpuPoints = this.chartData.map((value, index) => {
      const x = chartWidth * (index / (this.maxDataPoints - 1));
      const y = chartHeight * (1 - value / 100);
      return `${x},${y}`;
    }).join(' ');
    
    // Generate points for Memory line
    const memPoints = this.memoryData.map((value, index) => {
      const x = chartWidth * (index / (this.maxDataPoints - 1));
      const y = chartHeight * (1 - value / 100);
      return `${x},${y}`;
    }).join(' ');
    
    cpuLine.setAttribute('points', cpuPoints);
    memoryLine.setAttribute('points', memPoints);
  }

  getDataSourceClass(): string {
    if (this.isTransitioning) return 'transitioning';
    return this.usingMockData ? 'mock-data' : 'live-data';
  }
}