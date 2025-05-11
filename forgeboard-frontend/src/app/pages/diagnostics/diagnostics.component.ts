import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DiagnosticsService } from '../../services/diagnostics.service';
import {
  MetricData,
  HealthTimelinePoint,
  SocketInfo,
  HealthData,
  SocketMetrics,
  SocketLogEvent
} from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  standalone: false
})
export class DiagnosticsComponent implements OnInit, OnDestroy {
  liveMetrics$ = new BehaviorSubject<MetricData | null>(null);
  healthData: HealthData | null = null;
  health: { status: string; uptime: number } = { status: 'unknown', uptime: 0 };
  socketStatus = 'disconnected';
  
  // System information properties
  services: string[] = [];
  controllers: string[] = [];
  gateways: string[] = [];
  errors: string[] = [];

  timelinePoints: HealthTimelinePoint[] = [];
  socketMetrics: SocketMetrics = { totalConnections: 0, activeConnections: 0, disconnections: 0, errors: 0, messagesSent: 0, messagesReceived: 0 };
  activeSockets: SocketInfo[] = [];
  socketLogs: SocketLogEvent[] = [];

  private subs = new Subscription();

  constructor(private diagnosticsService: DiagnosticsService) {}

  ngOnInit(): void {
    this.subs.add(
      this.diagnosticsService.getLiveMetrics().subscribe(
        data => this.liveMetrics$.next(data),
        () => this.liveMetrics$.next(null)
      )
    );

    this.subs.add(
      this.diagnosticsService.getHealthUpdates().subscribe(h => this.healthData = h)
    );

    this.subs.add(
      this.diagnosticsService.getTimelinePoints().subscribe(points => this.timelinePoints = points)
    );

    this.subs.add(
      this.diagnosticsService.getSocketStatus().subscribe(s => {
        if (s) {
          this.socketMetrics = s.metrics;
          this.activeSockets = s.activeSockets;
        }
      })
    );

    this.subs.add(
      this.diagnosticsService.getSocketLogs().subscribe(logs => this.socketLogs = logs)
    );

    this.subs.add(
      this.diagnosticsService.getConnectionStatus().subscribe(() => {
        // optional connection status handling
      })
    );

    this.subs.add(
      this.diagnosticsService.getHealth().subscribe(init => {
        if (!this.healthData || this.healthData.status === 'unknown') {
          this.healthData = init;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.liveMetrics$.complete();
  }

  formatUptime(uptimeInSeconds: number | undefined): string {
    if (uptimeInSeconds === undefined) return 'N/A';
    const days = Math.floor(uptimeInSeconds / (3600 * 24));
    const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-unknown';
    switch (status.toLowerCase()) {
      case 'healthy': return 'status-healthy';
      case 'up': return 'status-healthy';
      case 'degraded': return 'status-degraded';
      case 'unhealthy': return 'status-unhealthy';
      case 'down': return 'status-unhealthy';
      default: return 'status-unknown';
    }
  }

  getSocketStatusClass(socket: SocketInfo | undefined): string {
    if (!socket) return 'socket-unknown';
    return socket.disconnectTime ? 'socket-disconnected' : 'socket-connected';
  }
  formatSocketDuration(socket: SocketInfo | undefined): string {
    if (!socket || !socket.connectTime) return 'N/A';
    const connectTime = new Date(socket.connectTime).getTime();
    const endTime = socket.disconnectTime ? new Date(socket.disconnectTime).getTime() : Date.now();
    const durationMs = endTime - connectTime;

    if (durationMs < 0) return 'N/A';
    
    // Format the duration in a human-readable format
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }  }
  // formatUptime function already defined above
  
  getEventTypeClass(type: string): string {
    switch (type) {
      case 'error': return 'event-error';
      case 'warning': return 'event-warning';
      case 'info': return 'event-info';
      default: return 'event-default';
    }
  }
}
