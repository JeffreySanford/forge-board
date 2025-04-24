import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit {
  featuredTiles = [
    {
      title: 'Metrics Dashboard',
      description: 'Monitor system performance with real-time metrics visualization',
      icon: 'bar_chart',
      route: '/metrics',
      color: '#4eff91'
    },
    {
      title: 'Kablan Board',
      description: 'Visualize and manage project workflows using Kanban methodology',
      icon: 'dashboard',
      route: '/kablan',
      color: '#ffe066'
    },
    {
      title: 'Diagnostics',
      description: 'System health monitoring and detailed diagnostics reporting',
      icon: 'healing',
      route: '/diagnostics',  // Updated to the dedicated diagnostics route
      color: '#3498db'
    },
    {
      title: 'Logger',
      description: 'Real-time log monitoring with filtering and search capabilities',
      icon: 'receipt_long',
      route: '/logs',  // Updated to the dedicated logs route
      color: '#e74c3c'
    }
  ];
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('HomeComponent initialized');
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
