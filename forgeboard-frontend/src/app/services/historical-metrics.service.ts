import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, Subject, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  HistoricalMetrics,
  HistoricalMetricsRequest,
  HistoricalMetricsResponse,
  MetricsInterval,
  MetricsSource,
  MetricsVisualizationConfig,
  MetricsSeries,
  SystemPerformanceSnapshot
} from '@forge-board/shared/api-interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoricalMetricsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/historical-metrics`;
  
  // BehaviorSubject to store current metrics
  private metricsSubject = new BehaviorSubject<HistoricalMetrics[]>([]);
  private performanceSubject = new BehaviorSubject<SystemPerformanceSnapshot | null>(null);
  
  // Configuration for visualizations
  private configSubject = new BehaviorSubject<MetricsVisualizationConfig>({
    showAnimations: true,
    colorScheme: 'standard',
    defaultInterval: '1h',
    preferredChartType: 'line',
    showLegend: true,
    enableZoom: true,
    autoRefresh: true,
    refreshInterval: 30
  });
  
  // Real-time refresh management
  private stopPolling = new Subject<void>();
  private pollingActive = false;
  
  // Public observables
  public metrics$ = this.metricsSubject.asObservable();
  public performance$ = this.performanceSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get historical metrics for the specified time range and interval
   */
  getHistoricalMetrics(request: HistoricalMetricsRequest): Observable<HistoricalMetricsResponse> {
    return this.http.post<HistoricalMetricsResponse>(`${this.baseUrl}`, request).pipe(
      tap(response => {
        if (response.metrics) {
          this.metricsSubject.next(response.metrics);
        }
      }),
      catchError(error => {
        console.error('Error fetching historical metrics', error);
        return of({
          success: false,
          metrics: [], 
          series: [],
          timeRange: {
            start: request.startDate || new Date().toISOString(),
            end: request.endDate || new Date().toISOString()
          },
          startDate: request.startDate || new Date().toISOString(), 
          endDate: request.endDate || new Date().toISOString(),
          interval: request.interval || '1h',
          count: 0
        });
      })
    );
  }
  
  /**
   * Get the latest system performance snapshot
   */
  getLatestPerformance(): Observable<SystemPerformanceSnapshot> {
    return this.http.get<SystemPerformanceSnapshot>(`${this.baseUrl}/performance/latest`).pipe(
      tap(performance => {
        this.performanceSubject.next(performance);
      }),
      catchError(error => {
        console.error('Error fetching latest performance', error);
        return of({
          timestamp: new Date().toISOString(),
          cpu: 0,
          memory: 0,
          activeConnections: 0,
          requestsPerMinute: 0,
          errorsPerMinute: 0,
          averageResponseTime: 0,
          activeUsers: 0
        });
      })
    );
  }
  
  /**
   * Start real-time polling of metrics
   */
  startRealTimeUpdates(intervalSeconds: number = 30): void {
    if (this.pollingActive) {
      this.stopRealTimeUpdates();
    }
    
    this.pollingActive = true;
    
    timer(0, intervalSeconds * 1000).pipe(
      switchMap(() => this.getLatestPerformance()),
      takeUntil(this.stopPolling)
    ).subscribe();
  }
  
  /**
   * Stop real-time polling
   */
  stopRealTimeUpdates(): void {
    this.stopPolling.next();
    this.pollingActive = false;
  }
  
  /**
   * Update visualization configuration
   */
  updateVisualizationConfig(config: Partial<MetricsVisualizationConfig>): void {
    const currentConfig = this.configSubject.getValue();
    this.configSubject.next({
      ...currentConfig,
      ...config
    });
    
    // If auto-refresh setting changed
    if ('autoRefresh' in config || 'refreshInterval' in config) {
      if (config.autoRefresh === false || (currentConfig.autoRefresh && this.pollingActive)) {
        this.stopRealTimeUpdates();
      }
      
      if (config.autoRefresh === true || (config.autoRefresh === undefined && currentConfig.autoRefresh)) {
        const interval = config.refreshInterval || currentConfig.refreshInterval;
        this.startRealTimeUpdates(interval);
      }
    }
  }
  
  /**
   * Get metrics for specific source systems
   */
  getMetricsBySource(source: MetricsSource, interval: MetricsInterval = '1h', limit: number = 100): Observable<MetricsSeries[]> {
    const request: HistoricalMetricsRequest = {
      sources: [source],
      interval,
      limit
    };
    
    return this.getHistoricalMetrics(request).pipe(
      map(response => response.series || [])
    );
  }
  
  /**
   * Get the current visualization config
   */
  getVisualizationConfig(): MetricsVisualizationConfig {
    return this.configSubject.getValue();
  }
}
