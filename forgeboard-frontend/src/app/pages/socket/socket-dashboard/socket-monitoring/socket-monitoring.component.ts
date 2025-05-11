import { Component, OnInit } from '@angular/core';
import { SocketRegistryService } from '../../../../services/socket-registry.service'; // Adjusted path
import { SocketInfo } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-socket-monitoring',
  templateUrl: './socket-monitoring.component.html', // Correct path
  styleUrls: ['./socket-monitoring.component.scss'],   // Correct path
  standalone: false // ensure no standalone components
})
export class SocketMonitoringComponent implements OnInit {
  activeSockets: SocketInfo[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private socketRegistryService: SocketRegistryService) { }

  ngOnInit(): void {
    this.fetchActiveSockets();
    console.log('SocketMonitoringComponent initialized');
  }

  fetchActiveSockets(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Attempting to fetch active sockets from backend.');
    this.socketRegistryService.getBackendActiveSockets().subscribe({
      next: (sockets) => {
        this.activeSockets = sockets;
        this.isLoading = false;
        console.log('Successfully fetched active sockets:', sockets);
      },
      error: (err) => {
        console.error('Error fetching active sockets:', err);
        this.error = 'Failed to load active sockets. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
