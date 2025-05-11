import { Component, OnInit } from '@angular/core';
import { SocketInfo } from '@forge-board/shared/api-interfaces'; // Assuming SocketInfo is needed
import { SocketRegistryService } from '../../../services/socket-registry.service'; // Assuming service is needed

@Component({
  selector: 'app-socket-dashboard',
  templateUrl: './socket-dashboard.component.html',
  styleUrls: ['./socket-dashboard.component.scss'],
  standalone: false // Ensure component is not standalone
})
export class SocketDashboardComponent implements OnInit {
  activeSockets: SocketInfo[] = []; // Add activeSockets property
  isLoading = false;
  error: string | null = null;

  constructor(private socketRegistryService: SocketRegistryService) { } // Inject service if needed

  ngOnInit(): void {
    // Optionally load data or set up subscriptions here
    // For example, if the dashboard itself needs to show a summary of sockets:
    this.fetchActiveSockets(); // Example call
  }

  // Example method if needed by the dashboard component itself
  fetchActiveSockets(): void {
    this.isLoading = true;
    this.error = null;
    this.socketRegistryService.getBackendActiveSockets().subscribe({
      next: (sockets) => {
        this.activeSockets = sockets;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching active sockets for dashboard:', err);
        this.error = 'Failed to load socket data for dashboard.';
        this.isLoading = false;
      }
    });
  }
}