import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { DiagnosticsService, SocketInfo, SocketMetrics, SocketLogEvent, HealthData } from '../../services/diagnostics.service';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

interface TimelinePoint {
  title: string;
  content: string;
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  icon: string;
}

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  standalone: false
})
export class DiagnosticsComponent implements OnInit, OnDestroy {
  // Add missing properties referenced in the template
  services: string[] = [];
  controllers: string[] = [];
  gateways: string[] = [];
  errors: string[] = [];
  
  // Health data
  health: HealthData = {
    status: 'unknown',
    uptime: 0,
    timestamp: new Date().toISOString(),
    details: {
      past: '',
      present: '',
      future: ''
    }
  };
  
  // Socket information
  activeSockets: SocketInfo[] = [];
  socketMetrics: SocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
  };
  socketLogs: SocketLogEvent[] = [];
  
  // Add metrics$ observable
  metrics$: Observable<SocketResponse<any>>;
  
  // Track socket status
  socketStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  
  // Subscriptions
  public socketEvents: Subscription = new Subscription();
  private subscriptions = new Subscription();
  private connectionStatusSubscription: Subscription | null = null;

  // Structured timeline points for enhanced display
  timelinePoints: TimelinePoint[] = [];
  
  private subscription = new Subscription();

  constructor(private diagnosticsService: DiagnosticsService) {
    // Initialize metrics$ observable
    this.metrics$ = this.diagnosticsService.getHealthUpdates() as Observable<SocketResponse<any>>;
  }

  ngOnInit(): void {
    // Fetch services, controllers, and gateways
    this.loadServices();
    this.loadHealth();
    
    // Set up socket connection for real-time updates
    this.socketEvents = new Subscription();
    
    // Subscribe to health updates
    this.socketEvents.add(
      this.diagnosticsService.getHealthUpdates().subscribe({
        next: health => {
          this.health = health;
          this.updateTimeline();
        },
        error: err => {
          this.errors.push(`Health update error: ${err.message}`);
          this.socketStatus = 'error';
        }
      })
    );

    // Subscribe to socket status updates
    this.socketEvents.add(
      this.diagnosticsService.getSocketStatus().subscribe({
        next: status => {
          this.activeSockets = status.activeSockets;
          this.socketMetrics = status.metrics;
        },
        error: err => {
          this.errors.push(`Socket status error: ${err.message}`);
        }
      })
    );
    
    // Subscribe to socket logs
    this.socketEvents.add(
      this.diagnosticsService.getSocketLogs().subscribe({
        next: logs => {
          this.socketLogs = logs;
        },
        error: err => {
          this.errors.push(`Socket logs error: ${err.message}`);
        }
      })
    );

    // Track socket connection status
    this.connectionStatusSubscription = this.diagnosticsService.getConnectionStatus().subscribe(status => {
      this.socketStatus = status ? 'connected' : 'disconnected';
    });
    
    // Add to socketEvents to ensure it's cleaned up
    if (this.connectionStatusSubscription) {
      this.socketEvents.add(this.connectionStatusSubscription);
    }

    // Subscribe to health updates from the service
    this.subscription.add(
      this.diagnosticsService.getHealthUpdates().subscribe(health => {
        this.health = health;
        this.updateTimeline();
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    // Clean up socketEvents subscription
    if (this.socketEvents) {
      this.socketEvents.unsubscribe();
    }
    
    // Clean up connection status subscription explicitly
    if (this.connectionStatusSubscription) {
      this.connectionStatusSubscription.unsubscribe();
      this.connectionStatusSubscription = null;
    }

    this.subscription.unsubscribe();
  }

  loadServices(): void {
    this.subscriptions.add(
      this.diagnosticsService.getSocketInfo().subscribe(data => {
        this.services = ['AppService', 'MetricsService', 'DiagnosticsService', 'TileStateService', 'SocketRegistryService'];
        this.controllers = ['AppController', 'MetricsController', 'DiagnosticsController', 'TileStateController', 'SocketController'];
        this.gateways = ['MetricsGateway', 'DiagnosticsGateway'];
        
        // Update socket data
        this.activeSockets = data.activeSockets;
        this.socketMetrics = data.metrics;
      })
    );
  }

  loadHealth(): void {
    this.subscriptions.add(
      this.diagnosticsService.getHealth().subscribe(health => {
        this.health = health;
      })
    );
  }

  registerEvent(): void {
    // Placeholder for registering diagnostic events
  }
  
  // Helper methods for socket diagnostics
  getSocketStatusClass(socket: SocketInfo): string {
    if (socket.disconnectTime) {
      return 'disconnected';
    }
    return 'connected';
  }
  
  formatSocketDuration(socket: SocketInfo): string {
    const start = new Date(socket.connectTime).getTime();
    const end = socket.disconnectTime ? 
      new Date(socket.disconnectTime).getTime() : 
      new Date().getTime();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  getEventTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'error': return 'event-error';
      case 'connect': return 'event-success';
      case 'disconnect': return 'event-warning';
      default: return 'event-info';
    }
  }

  /**
   * Update the timeline points based on the latest health data
   */
  updateTimeline(): void {
    // Create past timeline point
    const pastPoint: TimelinePoint = {
      title: 'Past',
      content: this.health.details.past || 'No past data available',
      timestamp: this.extractTimestampFromPast(),
      status: this.determineStatusFromText(this.health.details.past),
      icon: 'history'
    };
    
    // Create present timeline point
    const presentPoint: TimelinePoint = {
      title: 'Present',
      content: this.health.details.present || `Server is ${this.health.status} with uptime of ${this.formatUptime(this.health.uptime)}`,
      timestamp: this.health.timestamp,
      status: this.health.status as any,
      icon: 'schedule'
    };
    
    // Create future timeline point
    const futurePoint: TimelinePoint = {
      title: 'Future',
      content: this.health.details.future || 'No prediction available',
      timestamp: this.calculateFutureTimestamp(),
      status: this.determineFutureStatus(),
      icon: 'trending_up'
    };
    
    this.timelinePoints = [pastPoint, presentPoint, futurePoint];
  }
  
  /**
   * Extract the timestamp information from past text
   */
  private extractTimestampFromPast(): string {
    // Simple extraction - in a real app, might use regex or more sophisticated parsing
    const pastText = this.health.details.past || '';
    const match = pastText.match(/(\d+) seconds ago/);
    if (match && match[1]) {
      const secondsAgo = parseInt(match[1], 10);
      const pastDate = new Date(new Date(this.health.timestamp).getTime() - secondsAgo * 1000);
      return pastDate.toISOString();
    }
    return this.health.timestamp;
  }
  
  /**
   * Calculate a future timestamp for prediction display
   */
  private calculateFutureTimestamp(): string {
    // Simple prediction - 10 minutes into the future
    const futureDate = new Date(new Date(this.health.timestamp).getTime() + (10 * 60 * 1000));
    return futureDate.toISOString();
  }
  
  /**
   * Determine status from text description
   */
  private determineStatusFromText(text: string = ''): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('healthy')) return 'healthy';
    if (lowerText.includes('degrad')) return 'degraded';
    if (lowerText.includes('unhealthy') || lowerText.includes('error')) return 'unhealthy';
    return 'unknown';
  }
  
  /**
   * Determine future status based on trends
   */
  private determineFutureStatus(): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    const futureText = this.health.details.future?.toLowerCase() || '';
    if (futureText.includes('remain "healthy"') || futureText.includes('improve')) return 'healthy';
    if (futureText.includes('degrad')) return 'degraded';
    if (futureText.includes('fail') || futureText.includes('critical')) return 'unhealthy';
    // Default to current status if no clear indication
    return this.health.status as any || 'unknown';
  }
  
  /**
   * Format uptime in a human-readable way
   */
  formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes, ${seconds % 60} seconds`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hours, ${minutes} minutes`;
  }
  
  /**
   * Get CSS class for timeline point based on status
   */
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy': return 'ok';
      case 'degraded': return 'degraded';
      case 'unhealthy': return 'unhealthy';
      default: return 'unknown';
    }
  }
}
