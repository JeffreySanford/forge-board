import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface FeatureTile {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  showIndicator: boolean;
  revNumber: number; // Added revision number property
  revLetter: string; // Added revision letter property
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit {
  featuredTiles: FeatureTile[] = [
    {
      title: 'Metrics Dashboard',
      description: 'Monitor system performance with real-time metrics visualization',
      icon: 'bar_chart',
      route: '/metrics',
      color: '#4eff91',
      showIndicator: false,
      revNumber: 2,
      revLetter: 'A'
    },
    {
      title: 'Kanban Board',
      description: 'Visualize and manage project workflows using Kanban methodology',
      icon: 'dashboard',
      route: '/kanban',
      color: '#ffe066',
      showIndicator: false,
      revNumber: 3,
      revLetter: 'B'
    },
    {
      title: 'Diagnostics',
      description: 'System health monitoring and detailed diagnostics reporting',
      icon: 'healing',
      route: '/diagnostics',
      color: '#3498db',
      showIndicator: false,
      revNumber: 1,
      revLetter: 'C'
    },
    {
      title: 'Logger',
      description: 'Real-time log monitoring with filtering and search capabilities',
      icon: 'receipt_long',
      route: '/logs',
      color: '#e74c3c',
      showIndicator: false,
      revNumber: 4,
      revLetter: 'D'
    },
    {
      title: 'Documentation',
      description: 'Comprehensive system documentation and API references',
      icon: 'description',
      route: '/documentation',
      color: '#9b59b6',
      showIndicator: false,
      revNumber: 2,
      revLetter: 'E'
    }
  ];
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('HomeComponent initialized');
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Toggle the indicator for a specific tile
   * @param title The title of the tile to toggle the indicator for
   * @param event The click event
   */
  toggleIndicator(title: string, event?: Event): void {
    // Stop the click event from propagating to parent elements
    if (event) {
      event.stopPropagation();
    }
    
    // Find the tile with the matching title and toggle its indicator
    const tile = this.featuredTiles.find(t => t.title === title);
    if (tile) {
      tile.showIndicator = !tile.showIndicator;
    }
  }
}
