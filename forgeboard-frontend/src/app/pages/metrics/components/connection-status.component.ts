import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss'],
  standalone: false
})
export class ConnectionStatusComponent implements OnInit {
  status: 'connected' | 'disconnected' | 'connecting' = 'connecting';
  lastConnected: Date | null = null;

  constructor() {
    // Initial status can be set here if needed
    this.status = 'connecting'; // Default to connecting
    this.lastConnected = null; // No last connected time initially
  }

  ngOnInit(): void {
    // Simulate a connection after a short delay
    setTimeout(() => {
      this.status = 'connected';
      this.lastConnected = new Date();
    }, 1500);
  }

  getStatusClass(): string {
    switch(this.status) {
      case 'connected': return 'status-connected';
      case 'disconnected': return 'status-disconnected';
      default: return 'status-connecting';
    }
  }
}
