import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Observable, Subscription, of, timer } from 'rxjs';
import { catchError, tap, retryWhen, scan, delayWhen } from 'rxjs/operators';
import { MetricData } from '@forge-board/shared/api-interfaces';
import { MetricsService } from '../../services/metrics.service';
import { BackendStatusService } from '../../services/backend-status.service';
import { RefreshIntervalService } from '../../services/refresh-interval.service';

// Define extended metric data interface
interface ExtendedMetricData extends MetricData {
  responseTime?: number;
  activeUsers?: number;
  systemLoad?: string;
  diskReadRate?: number;
  diskWriteRate?: number;
  processMemory?: number;
  requestRate?: number;
}

@Component({
  selector: 'app-metric',
  templateUrl: './metric.component.html',
  styleUrls: ['./metric.component.scss'],
  standalone: false
})
export class MetricComponent implements OnInit, OnDestroy, AfterViewInit {
  metrics$: Observable<ExtendedMetricData>; // Changed from MetricData to ExtendedMetricData
  refreshInterval: number = 3000; // Default refresh interval changed to 3000ms (3 seconds)
  chartData: number[] = [];
  memoryData: number[] = [];
  maxDataPoints = 30;
  chartInitialized = false;
  usingMockData = false;
  isTransitioning = false; // Add a flag to track transitions
  connectionAttempts = 0;
  maxConnectionAttempts = 5;
  
  // Cache for formatted response times to prevent change detection errors
  private cachedResponseTimes: Map<string, string> = new Map();
  
  // Additional metrics tracking
  private activeUsersCount = Math.floor(Math.random() * 20) + 5; // Starting value for active users
  private requestRateValue = Math.floor(Math.random() * 50) + 10; // Starting value for req/sec
  private lastRequestCount = 0;
  private systemLoadValue = (Math.random() * 2 + 0.5).toFixed(2); // Random starting system load
  private diskIOReadRate = Math.floor(Math.random() * 500) + 100; // KB/s
  private diskIOWriteRate = Math.floor(Math.random() * 300) + 50; // KB/s
  private processMemoryValue = Math.floor(Math.random() * 1024) + 256; // MB
  
  @ViewChild('chart') chartElement!: ElementRef<HTMLDivElement>;
  private subscription = new Subscription();
  
  constructor(
    private metricsService: MetricsService,
    private backendStatusService: BackendStatusService,
    private refreshIntervalService: RefreshIntervalService
  ) {
    this.metrics$ = this.metricsService.getMetricsStream();
    
    // Pre-fill chart data with zeros
    this.chartData = Array(this.maxDataPoints).fill(0);
    this.memoryData = Array(this.maxDataPoints).fill(0);
  }

  ngOnInit(): void {
    // Get the current global interval
    this.refreshInterval = this.refreshIntervalService.getInterval();
    
    // Subscribe to interval changes
    this.subscription.add(
      this.refreshIntervalService.getIntervalObservable().subscribe(interval => {
        this.refreshInterval = interval;
      })
    );
    
    // Subscribe to metrics stream to update chart data
    this.subscription.add(
      this.metrics$.pipe(
        // Add advanced retry logic with exponential backoff
        retryWhen((errors: Observable<Error>) => errors.pipe(
          scan((attempts: number, error: Error) => {
            this.connectionAttempts++;
            if (this.connectionAttempts > this.maxConnectionAttempts) {
              throw error;
            }
            console.log(`Metrics connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
            return attempts + 1;
          }, 0),
          delayWhen((attempts: number) => {
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
            console.log(`Retrying metrics connection in ${delay}ms`);
            return timer(delay);
          }),
          tap(() => console.log('Attempting to reconnect to metrics service...'))
        )),
        // Handle errors without breaking the stream
        catchError(error => {
          console.warn('Error in metrics stream (falling back to mock data):', error);
          // Notify backend status service about metrics failure
          this.backendStatusService.updateGatewayStatus('metrics', false, true);
          // Return empty metrics to avoid breaking the subscription
          return of({ cpu: 0, memory: 0, time: new Date().toISOString() } as MetricData);
        })
      ).subscribe(metrics => {
        if (metrics) {
          // Reset connection attempts on successful data
          this.connectionAttempts = 0;
          
          // Add new data point to chart arrays with safety checks
          const cpuValue = (metrics.cpu !== undefined && metrics.cpu !== null) ? metrics.cpu : 0;
          const memValue = (metrics.memory !== undefined && metrics.memory !== null) ? metrics.memory : 0;
          
          this.chartData.push(cpuValue);
          this.chartData = this.chartData.slice(-this.maxDataPoints);
          
          this.memoryData.push(memValue);
          this.memoryData = this.memoryData.slice(-this.maxDataPoints);
          
          // Update additional metrics values (based on real data or simulated)
          this.updateAdditionalMetrics(metrics);
          
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
  

  formatResponseTime(metrics: ExtendedMetricData): string {
    // Create a cache key based on metrics
    const cacheKey = metrics.time || String(Date.now());
    
    // If we have a cached value for this metrics object, return it
    if (this.cachedResponseTimes.has(cacheKey)) {
      const cachedValue = this.cachedResponseTimes.get(cacheKey);
      // Only return if we have a valid value
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }
    
    // Otherwise generate a new value
    let result: string;
    
    // Use real data if available, otherwise use simulated
    if (metrics.responseTime) {
      const responseTime = metrics.responseTime;
      const days = Math.floor(responseTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((responseTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((responseTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((responseTime % (1000 * 60)) / 1000);
      result = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      // For simulated data, generate a stable value for this render cycle
      const simulatedResponseTime = Math.floor(Math.random() * 1000) + 100;
      const days = Math.floor(simulatedResponseTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((simulatedResponseTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((simulatedResponseTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((simulatedResponseTime % (1000 * 60)) / 1000);
      result = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    // Cache the result and return it
    this.cachedResponseTimes.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues
    if (this.cachedResponseTimes.size > 100) {
      const keysIterator = this.cachedResponseTimes.keys();
      const firstKey = keysIterator.next().value;
      if (firstKey !== undefined) {
        this.cachedResponseTimes.delete(firstKey);
      }
    }
    
    return result;
  }
  
  /**
   * Format the response time for display
   */
  formatResponseTimeDisplay(metrics: ExtendedMetricData): string {
    return this.formatResponseTime(metrics);
  }

  /**
   * Updates the additional metrics with simulated or real data
   */
  private updateAdditionalMetrics(metrics: ExtendedMetricData): void {
    // Update active users - small changes over time
    if (Math.random() > 0.7) {
      const change = Math.random() > 0.5 ? 1 : -1;
      this.activeUsersCount = Math.max(2, this.activeUsersCount + change);
    }
    
    // Update request rate - correlate to CPU load
    const baseRequests = metrics.cpu ? Math.floor(metrics.cpu / 2) + 5 : 10;
    this.requestRateValue = baseRequests + Math.floor(Math.random() * 10);
    
    // Update system load - correlate to CPU but smoother
    const targetLoad = metrics.cpu ? (metrics.cpu / 50 + 0.5) : 1.0;
    const currentLoad = parseFloat(this.systemLoadValue);
    // Smooth changes to system load
    const newLoad = currentLoad + (targetLoad - currentLoad) * 0.3;
    this.systemLoadValue = newLoad.toFixed(2);
    
    // Update disk I/O rates
    if (metrics.disk) {
      // Higher disk usage correlates to higher I/O
      const diskFactor = metrics.disk / 100;
      this.diskIOReadRate = Math.floor(200 + 800 * diskFactor + Math.random() * 100);
      this.diskIOWriteRate = Math.floor(100 + 400 * diskFactor + Math.random() * 50);
    } else {
      // Random fluctuations if no real data
      if (Math.random() > 0.8) {
        const factor = 0.8 + Math.random() * 0.4;
        this.diskIOReadRate = Math.floor(this.diskIOReadRate * factor);
        this.diskIOWriteRate = Math.floor(this.diskIOWriteRate * factor);
      }
    }
    
    // Update process memory - correlated to memory usage but with limits
    if (metrics.memory) {
      const targetMemory = 256 + Math.floor(metrics.memory * 10);
      this.processMemoryValue = this.processMemoryValue + 
        Math.floor((targetMemory - this.processMemoryValue) * 0.2);
    } else if (Math.random() > 0.8) {
      // Random fluctuations if no real data
      const change = Math.floor((Math.random() * 20) - 5);
      this.processMemoryValue = Math.max(256, this.processMemoryValue + change);
    }
  }
  
  /**
   * Format the active users count for display
   */
  formatActiveUsers(): string {
    return `${this.activeUsersCount}`;
  }
  
  /**
   * Format the request rate for display
   */
  formatRequestRate(metrics: ExtendedMetricData): string {
    // Use real data if available, otherwise use simulated
    const rate = metrics.requestRate || this.requestRateValue;
    return `${rate}`;
  }
  
  /**
   * Format the system load for display
   */
  formatSystemLoad(): string {
    return this.systemLoadValue;
  }
  
  /**
   * Format the disk I/O for display
   */
  formatDiskIO(metrics: ExtendedMetricData): string {
    // Use real data if available
    const readRate = metrics.diskReadRate || this.diskIOReadRate;
    const writeRate = metrics.diskWriteRate || this.diskIOWriteRate;
    
    // Format as KB/s or MB/s depending on size
    if (readRate >= 1024) {
      return `${(readRate / 1024).toFixed(1)}/${(writeRate / 1024).toFixed(1)} MB/s`;
    } else {
      return `${readRate}/${writeRate} KB/s`;
    }
  }
  
  /**
   * Format the process memory for display
   */
  formatProcessMemory(metrics: ExtendedMetricData): string {
    // Use real data if available
    const memory = metrics.processMemory || this.processMemoryValue;
    
    // Format as MB or GB depending on size
    if (memory >= 1024) {
      return `${(memory / 1024).toFixed(1)} GB`;
    } else {
      return `${memory} MB`;
    }
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
    // Use the central refresh interval service instead of the metrics service directly
    this.refreshIntervalService.setInterval(value);
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
    let classes = this.usingMockData ? 'mock-data' : 'live-data';
    if (this.isTransitioning) {
      classes += ' transitioning';
    }
    return classes;
  }
  
  /**
   * Get connection status text for display
   */
  getConnectionStatusText(): string {
    if (!this.usingMockData) {
      return 'Connected to metrics server';
    } else if (this.connectionAttempts > 0) {
      return `Connection issue - attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`;
    } else {
      return 'Using simulated metrics data';
    }
  }

  /**
   * Toggle between live and mock data
   */
  toggleDataSource(event: Event): void {
    const useMockData = (event.target as HTMLInputElement).checked;
    this.metricsService.toggleMockData(useMockData);
  }
}