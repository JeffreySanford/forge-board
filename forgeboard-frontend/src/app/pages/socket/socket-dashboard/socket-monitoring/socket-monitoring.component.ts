import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { SocketService } from '../../../../services/socket.service';
import { SocketRegistryService } from '../../../../services/socket-registry.service';
import { SocketEvent } from '../../../../services/socket.service';
import { SocketInfo } from '@forge-board/shared/api-interfaces';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-socket-monitoring',
  templateUrl: './socket-monitoring.component.html',
  styleUrls: ['./socket-monitoring.component.scss'],
  standalone: false
})
export class SocketMonitoringComponent implements OnInit, OnDestroy {
  activeSockets: SocketInfo[] = [];
  isLoading = false;
  error: string | null = null;
  refreshInterval: any;
  
  // Add a retry count to handle intermittent failures
  private retryCount = 0;
  private maxRetries = 3;

  constructor(
    private socketService: SocketService,
    private socketRegistryService: SocketRegistryService
  ) { }

  ngOnInit(): void {
    this.fetchActiveSockets();
    console.log('SocketMonitoringComponent initialized');
    
    // Set up automatic refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchActiveSockets();
    }, 30000);
  }

  ngOnDestroy(): void {
    // Clear the refresh interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  fetchActiveSockets(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Attempting to fetch active sockets from backend.');
    
    this.socketRegistryService.getBackendActiveSockets()
      .pipe(
        finalize(() => this.isLoading = false),
        // Add a fallback to empty array on error
        catchError(err => {
          console.error('Error fetching active sockets:', err);
          
          // Implement automatic retry up to maxRetries
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retry attempt ${this.retryCount} of ${this.maxRetries}...`);
            setTimeout(() => this.fetchActiveSockets(), 1000);
          } else {
            this.error = err.message || 'Failed to load active sockets. Please try again.';
            this.retryCount = 0;
          }
          
          return of([]);
        })
      )
      .subscribe({
        next: (sockets) => {
          this.activeSockets = sockets || [];
          this.retryCount = 0; // Reset retry counter on success
          console.log('Successfully fetched active sockets:', sockets);
        }
      });
  }
  
  // Method to manually refresh the socket list
  refreshSockets(): void {
    this.retryCount = 0; // Reset retry counter on manual refresh
    this.fetchActiveSockets();
  }
}
