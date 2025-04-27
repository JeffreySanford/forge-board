import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DiagnosticsService } from '../../../../services/diagnostics.service';
import { SocketStatusUpdate } from '@forge-board/shared/api-interfaces';
import { BackendStatusService } from '../../../../services/backend-status.service';

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  // Socket information
  socketStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  connectionTime: Date | null = null;
  lastActivity: Date | null = null;
  connectionDuration = 0;
  activeConnections = 0;
  totalConnections = 0;
  
  // Mock data status
  usingMockData = false;
  
  // Update timer for duration
  private durationTimer: any;
  
  // Subscriptions
  private subscriptions = new Subscription();

  constructor(
    private diagnosticsService: DiagnosticsService,
    private backendStatusService: BackendStatusService
  ) {}

  ngOnInit(): void {
    // Track socket connection status
    this.subscriptions.add(
      this.diagnosticsService.getConnectionStatus().subscribe(connected => {
        const wasConnected = this.socketStatus === 'connected';
        this.socketStatus = connected ? 'connected' : 'disconnected';
        
        // Update connection time when we connect
        if (connected && !wasConnected) {
          this.connectionTime = new Date();
          // Start timer to update duration
          this.startDurationTimer();
        }
        
        // Clear connection time when disconnected
        if (!connected && wasConnected) {
          this.stopDurationTimer();
        }
      })
    );
    
    // Track socket status updates for metrics
    this.subscriptions.add(
      this.diagnosticsService.getSocketStatus().subscribe(status => {
        this.updateSocketMetrics(status);
      })
    );
    
    // Track if we're using mock data
    this.subscriptions.add(
      this.backendStatusService.getStatus().subscribe(status => {
        if (status.gateways) {
          const diagnosticsGateway = status.gateways.find(g => g.name === 'diagnostics');
          this.usingMockData = diagnosticsGateway?.usingMockData || false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and timers
    this.subscriptions.unsubscribe();
    this.stopDurationTimer();
  }
  
  /**
   * Update socket metrics from status update
   */
  private updateSocketMetrics(status: SocketStatusUpdate): void {
    if (!status) return;
    
    // Update connection counts
    this.activeConnections = status.metrics.activeConnections;
    this.totalConnections = status.metrics.totalConnections;
    
    // If we have active sockets, update the last activity time
    if (status.activeSockets && status.activeSockets.length > 0) {
      const mostRecentActivity = status.activeSockets.reduce((latest, socket) => {
        const activityTime = new Date(socket.lastActivity).getTime();
        return activityTime > latest ? activityTime : latest;
      }, 0);
      
      if (mostRecentActivity > 0) {
        this.lastActivity = new Date(mostRecentActivity);
      }
    }
  }
  
  /**
   * Start timer to update connection duration
   */
  private startDurationTimer(): void {
    this.stopDurationTimer(); // Clear any existing timer
    
    // Update duration every second
    this.durationTimer = setInterval(() => {
      if (this.connectionTime) {
        const now = new Date();
        this.connectionDuration = Math.floor((now.getTime() - this.connectionTime.getTime()) / 1000);
      }
    }, 1000);
  }
  
  /**
   * Stop the duration timer
   */
  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }
  
  /**
   * Format duration in a human-readable way
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  
  /**
   * Get connection status class for styling
   */
  getConnectionStatusClass(): string {
    if (this.usingMockData) return 'mock';
    return this.socketStatus;
  }
}
