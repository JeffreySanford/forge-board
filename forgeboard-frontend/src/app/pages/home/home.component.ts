import { Component, OnInit } from '@angular/core';

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
    }
  ];
  
  constructor() {
    // Initialization logic can go here if needed
  }

  ngOnInit(): void {
    console.log('HomeComponent initialized');}
  }
