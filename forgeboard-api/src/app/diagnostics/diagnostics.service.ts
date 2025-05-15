import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { HealthData, HealthTimelinePoint } from '@forge-board/shared/api-interfaces'; 
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs'; 

// Add DiagnosticEventResponse interface definition
interface DiagnosticEventResponse {
  success: boolean;
  timestamp: string;
  id: string;
  eventType: string;
}

/**
 * Service providing system diagnostics through reactive streams
 * 
 * Features:
 * - Timeline of health events as a hot observable stream
 * - System health metrics
 * - Error logging and monitoring
 * 
 * @example
 * // Subscribe to timeline events
 * diagnosticsService.timelinePoints$.subscribe(points => {
 *   console.log(`Timeline has ${points.length} points`);
 * });
 */
@Injectable()
export class DiagnosticsService implements OnModuleDestroy {
  private readonly logger = new Logger(DiagnosticsService.name);
  private readonly startTime = Date.now();
  private errorLog: string[] = [];
  
  /**
   * BehaviorSubject that holds the complete timeline history
   * Initialized as an empty array and emits to all subscribers whenever updated
   */
  private timelinePointsSubject = new BehaviorSubject<HealthTimelinePoint[]>([]);
  
  /**
   * Hot observable of timeline points
   * Uses shareReplay(1) to ensure all new subscribers get the latest value
   */
  public timelinePoints$: Observable<HealthTimelinePoint[]> = this.timelinePointsSubject
    .asObservable()
    .pipe(shareReplay(1));

  constructor() {
    this.logger.log('Diagnostics Service initialized with reactive streams');
    this.addTimelinePoint({
      timestamp: new Date().toISOString(),
      status: 'unknown', // Initial status, will be updated by getHealth
      message: 'Application Backend Started',
      metadata: { service: DiagnosticsService.name, action: 'Initialization' }
    });
  }

  /**
   * Clean up resources when the module is destroyed
   */
  onModuleDestroy(): void {
    this.logger.log('DiagnosticsService cleaning up resources');
    this.timelinePointsSubject.complete();
  }

  public addTimelinePoint(point: HealthTimelinePoint): void {
    const currentPoints = this.timelinePointsSubject.getValue();
    // Optional: Limit the number of points to prevent memory issues
    // if (currentPoints.length >= 1000) {
    //   currentPoints.shift(); 
    // }
    this.timelinePointsSubject.next([...currentPoints, point]);
    this.logger.verbose(`Timeline point added: ${point.message}`);
  }
  
  public getTimelinePointsValue(): HealthTimelinePoint[] {
    return this.timelinePointsSubject.getValue();
  }
  
  logError(msg: string) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    this.logger.error(formattedMsg);
    
    this.errorLog.push(formattedMsg);
    if (this.errorLog.length > 50) this.errorLog.shift(); // Keep only the last 50 errors

    this.addTimelinePoint({
      timestamp,
      status: 'unhealthy', // Or determine based on error severity
      message: `Error logged: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`, // Truncate long messages
      metadata: { type: 'error', service: 'Unknown', details: msg }
    });
  }

  getServicesAndControllers() {
    return {
      services: [
        'AppService', 
        'MetricsService', 
        'DiagnosticsService', 
        'TileStateService',
        'SocketRegistryService',
        'SocketLoggerService'
      ],
      controllers: [
        'AppController', 
        'MetricsController', 
        'DiagnosticsController', 
        'TileStateController',
        'StatusController'
      ],
      gateways: [
        'MetricsGateway', 
        'DiagnosticsGateway',
        'SocketGateway'
      ],
      errors: this.errorLog,
      health: this.getHealth()
    };
  }

  getHealth(): HealthData {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';
    if (uptime > 0) {
      status = uptime > 60 ? 'healthy' : 'unknown';
    }

    // Add a timeline point for health status check if it changed or periodically
    const lastPoint = this.timelinePointsSubject.getValue().slice(-1)[0];
    if (!lastPoint || lastPoint.status !== status || (Date.now() - new Date(lastPoint.timestamp).getTime()) > 60000) { // Example: update if status changed or >1min ago
        this.addTimelinePoint({
            timestamp: new Date().toISOString(),
            status: status,
            message: `Health status updated to ${status}`,
            metadata: { uptime, service: DiagnosticsService.name, action: 'getHealth' }
        });
    }

    return {
      status,
      uptime,
      timestamp: new Date().toISOString(),
      details: {
        past: {
          message: `Server started ${uptime} seconds ago. Initial status was "${uptime > 10 ? 'healthy' : 'unknown'}".`
        },
        present: {
          message: `Server is currently "${status}" with uptime of ${uptime} seconds.`
        },
        future: {
          message: `If current trends continue, the server is expected to remain "${status}" and stable.`
        }
      }
    };
  }

  registerEvent(event: string): DiagnosticEventResponse {
    // Log the event or save it to database
    console.log(`Diagnostics event registered: ${event}`);
    const timestamp = new Date().toISOString();
    const id = uuidv4();

    this.addTimelinePoint({
      timestamp,
      status: 'healthy', // Assuming generic events are positive or neutral
      message: `Event registered: ${event}`,
      metadata: { eventType: event, eventId: id }
    });
    
    // Return a properly formatted response object
    return {
      success: true,
      timestamp: new Date().toISOString(),
      id: uuidv4(), // Generate unique ID for the event
      eventType: event
    };
  }
}
