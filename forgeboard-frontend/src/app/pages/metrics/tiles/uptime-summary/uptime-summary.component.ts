import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Tile, TileType } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-uptime-summary',
  templateUrl: './uptime-summary.component.html',
  styleUrls: ['./uptime-summary.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class UptimeSummaryComponent implements OnInit, OnDestroy, Tile {
  @Input() id: string = 'uptime';
  @Input() type: TileType = 'uptime';
  @Input() title: string = 'Uptime Summary';
  @Input() order: number = 3;
  @Input() visible: boolean = true;
  
  // Component-specific properties
  uptime: string = '00h 00m';
  startTime: Date = new Date();
  
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
    // Clean up all subscriptions
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }
  
  // Calculate uptime from start time
  private calculateUptime(): void {
    const now = new Date();
    const diffMs = now.getTime() - this.startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    this.uptime = `${hours}h ${minutes}m`;
  }
  
  // Public method for accessing formatted uptime
  getFormattedUptime(): string {
    return this.uptime;
  }
}
