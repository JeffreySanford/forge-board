import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Tile, TileType } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-uptime-summary',
  templateUrl: './uptime-summary.component.html',
  styleUrls: ['./uptime-summary.component.scss'],
  standalone: false
})
export class UptimeSummaryComponent implements OnInit, OnDestroy, Tile {
  position: number = 0;
  @Input() id: string = 'uptime';
  @Input() type: TileType = 'uptime';
  @Input() title: string = 'Uptime Summary';
  @Input() order: number = 3;
  @Input() visible: boolean = true;
  
  // Component-specific properties
  uptime: string = '00h 00m';
  startTime: Date = new Date();
  uptimePercent: number = 99.8;
  incidents: number = 0;
  
  // Track all subscriptions for cleanup
  private subscriptions = new Subscription();
  
  constructor() {
    // Initialize start time to current time
    this.startTime = new Date();
    // Set initial uptime to 0
    this.uptime = '00h 00m';
  }
  
  ngOnInit(): void {
    // Start with initial uptime calculation
    this.calculateUptime();
    
    // Update uptime every minute
    const timer$ = interval(60000).subscribe(() => {
      this.calculateUptime();
    });
    
    // Add to subscriptions for later cleanup
    this.subscriptions.add(timer$);
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.unsubscribe();
  }
  
  // Calculate uptime based on start time
  private calculateUptime(): void {
    const now = new Date();
    const diff = now.getTime() - this.startTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format the uptime string
    this.uptime = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
    
    // Simulate occasional incidents (about every 30 minutes)
    if (Math.random() > 0.997) {
      this.incidents++;
      this.uptimePercent = Math.max(90, this.uptimePercent - Math.random() * 0.5);
    }
  }
  
  // Public method for accessing formatted uptime
  getFormattedUptime(): string {
    return this.uptime;
  }
}
