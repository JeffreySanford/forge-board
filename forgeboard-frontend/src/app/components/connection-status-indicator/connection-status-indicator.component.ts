import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { BackendStatusService, BackendStatusSummary } from '../../services/backend-status.service';

/**
 * Component that displays the current backend connection status
 * and indicates when mock data is being used instead of real data.
 * 
 * This indicator can be positioned in any corner of the screen using the position input.
 */
@Component({
  selector: 'app-connection-status-indicator',
  templateUrl: './connection-status-indicator.component.html',
  styleUrls: ['./connection-status-indicator.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class ConnectionStatusIndicatorComponent implements OnInit, OnDestroy {
  /** Whether to always show connection details or only on expand */
  @Input() showDetails = false;
  
  /** Position of the indicator on the screen */
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'custom' = 'top-right';
  
  /** Current backend connection status */
  status: BackendStatusSummary | null = null;
  
  /** Whether the details panel is expanded */
  expanded = false;

  /** Whether reconnection is in progress */
  reconnecting = false;
  
  private subscription = new Subscription();

  constructor(private backendStatusService: BackendStatusService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.backendStatusService.getStatus().subscribe(status => {
        this.status = status;
        
        // Auto-expand when connection status changes or mock data is activated
        if (status.anyMockData) {
          this.expanded = true;
          setTimeout(() => this.expanded = false, 5000); // Auto-collapse after 5 seconds
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Toggle the expanded state of the connection details panel
   */
  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  /**
   * Get the appropriate CSS class based on the current status
   */
  getStatusClass(): string {
    if (!this.status) return 'unknown';
    if (this.status.anyMockData) return 'mock';
    if (this.status.allConnected) return 'connected';
    return 'disconnected';
  }
  
  /**
   * Force a reconnection attempt
   */
  forceReconnect(): void {
    this.reconnecting = true;
    this.backendStatusService.forceReconnectionCheck();
    
    // Reset reconnecting state after a timeout
    setTimeout(() => {
      this.reconnecting = false;
    }, 5000);
  }
}
