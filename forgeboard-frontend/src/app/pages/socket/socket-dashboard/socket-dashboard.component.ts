import { Component, OnInit } from '@angular/core';
import { SocketInfo } from '@forge-board/shared/api-interfaces';
import { SocketRegistryService } from '../../../services/socket-registry.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-socket-dashboard',
  templateUrl: './socket-dashboard.component.html',
  styleUrls: ['./socket-dashboard.component.scss'],
  standalone: false
})
export class SocketDashboardComponent implements OnInit {
  activeSockets: SocketInfo[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private socketRegistryService: SocketRegistryService) { }

  ngOnInit(): void {
    // Only fetch summary data for the dashboard itself
    this.fetchActiveSockets();
  }

  // Example method if needed by the dashboard component itself
  fetchActiveSockets(): void {
    this.isLoading = true;
    this.error = null;
    this.socketRegistryService.getBackendActiveSockets()
      .pipe(
        catchError(err => {
          console.error('Error fetching active sockets for dashboard:', err);
          this.error = 'Failed to load socket data for dashboard.';
          return of([]);
        })
      )
      .subscribe({
        next: (sockets) => {
          this.activeSockets = sockets;
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false; 
        }
      });
  }
}