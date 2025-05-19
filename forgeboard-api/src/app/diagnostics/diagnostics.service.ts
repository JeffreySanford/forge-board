import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Observable, interval, map } from 'rxjs';
import { HealthData, HistoricalMetrics, SystemPerformanceSnapshot } from '@forge-board/shared/api-interfaces';
import { DiagnosticEvent, DiagnosticTimelineEvent } from '@forge-board/shared/diagnostics.types';
import { randomUUID } from 'crypto';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);
  private events: DiagnosticEvent[] = [];
  private eventHistory$ = new BehaviorSubject<DiagnosticEvent[]>([]);
  private healthData: HealthData = {
    status: 'healthy',
    uptime: 0,
    timestamp: new Date().toISOString()
  };
  
  // Add the missing timelinePoints$ subject
  private timelinePointsArray: DiagnosticTimelineEvent[] = [];
  public timelinePoints$ = new BehaviorSubject<DiagnosticTimelineEvent[]>([]);
  
  private readonly startTime = Date.now();

  constructor() {
    this.logger.log('DiagnosticsService initialized');
    
    // Start updating uptime
    interval(5000).subscribe(() => {
      this.updateHealthData();
    });

    // Initialize with some example timeline points
    this.addTimelinePoint({
      id: randomUUID(),
      title: 'System Started',
      content: 'System services initialized successfully',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      icon: 'check_circle'
    });
  }

  /**
   * Add a diagnostic event to the system
   */
  addEvent(event: Omit<DiagnosticEvent, 'id' | 'timestamp'>): DiagnosticEvent {
    const fullEvent: DiagnosticEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    this.events.unshift(fullEvent);
    
    // Keep only the last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    
    // Update the observable
    this.eventHistory$.next([...this.events]);
    
    return fullEvent;
  }

  /**
   * Add timeline point
   */
  addTimelinePoint(point: DiagnosticTimelineEvent): void {
    this.timelinePointsArray.unshift(point);
    
    // Keep only the last 20 points
    if (this.timelinePointsArray.length > 20) {
      this.timelinePointsArray = this.timelinePointsArray.slice(0, 20);
    }
    
    // Update the observable
    this.timelinePoints$.next([...this.timelinePointsArray]);
  }

  /**
   * Get current timeline points value
   */
  getTimelinePointsValue(): DiagnosticTimelineEvent[] {
    return [...this.timelinePointsArray];
  }

  /**
   * Get current system health data
   */
  getHealth(): HealthData {
    this.updateHealthData();
    return this.healthData;
  }
  
  /**
   * Get services and controllers data
   */
  getServicesAndControllers() {
    return {
      services: [
        { name: "DiagnosticsService", status: "active", uptime: Math.floor((Date.now() - this.startTime) / 1000) },
        { name: "SocketRegistryService", status: "active", uptime: Math.floor((Date.now() - this.startTime) / 1000) },
        { name: "MetricsService", status: "active", uptime: Math.floor((Date.now() - this.startTime) / 1000) }
      ],
      controllers: [
        { name: "DiagnosticsController", endpoints: 3 },
        { name: "SocketController", endpoints: 5 },
        { name: "MetricsController", endpoints: 2 }
      ]
    };
  }

  /**
   * Get current diagnostic events
   */
  getCurrentEvents(): DiagnosticEvent[] {
    return [...this.events];
  }

  /**
   * Get observable of diagnostic events for real-time updates
   */
  getEventUpdates(): Observable<DiagnosticEvent[]> {
    return this.eventHistory$.asObservable();
  }

  /**
   * Get system historical metrics
   */
  getHistoricalMetrics(): Observable<HistoricalMetrics> {
    return interval(1000).pipe(
      map(() => this.generateHistoricalMetrics())
    );
  }

  /**
   * Update health data with current uptime
   */
  private updateHealthData(): void {
    const currentTime = Date.now();
    const uptimeMs = currentTime - this.startTime;
    
    this.healthData = {
      ...this.healthData,
      uptime: Math.floor(uptimeMs / 1000), // uptime in seconds
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate historical metrics for the system
   */
  private generateHistoricalMetrics(): HistoricalMetrics {
    const now = new Date();
    
    // Generate sample system performance data
    const performanceSnapshot: SystemPerformanceSnapshot = {
      timestamp: now.toISOString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      activeConnections: Math.floor(Math.random() * 100),
      requestsPerMinute: Math.floor(Math.random() * 500),
      errorsPerMinute: Math.floor(Math.random() * 10),
      averageResponseTime: Math.random() * 500,
      activeUsers: Math.floor(Math.random() * 50)
    };

    return {
      id: randomUUID(),
      timestamp: now.toISOString(),
      source: 'system',
      data: {
        cpu: performanceSnapshot.cpu,
        memory: performanceSnapshot.memory,
        activeConnections: performanceSnapshot.activeConnections
      }
    };
  }
}
