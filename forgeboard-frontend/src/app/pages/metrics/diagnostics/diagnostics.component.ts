import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TileType, TileDragEvent } from '@forge-board/shared/api-interfaces';
import { TileStateService } from '../../../services/tile-state.service';

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  standalone: false
})
export class DiagnosticsComponent implements OnInit {
  showLayoutBorder = true;
  showMetricsTile = true;
  showConnectionTile = true;
  showLogsTile = true;
  showUptimeTile = true;
  showActivityTile = true;
  tileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];

  constructor(private tileStateService: TileStateService) {}

  ngOnInit(): void {
    // Load tile order from backend
    const sub = this.tileStateService.getTileOrder('user1').subscribe(res => {
      if (res.order && res.order.length) {
        this.tileOrder = res.order as TileType[];
        
        // Apply visibility settings if available
        if (res.visibility) {
          this.showMetricsTile = res.visibility['metrics'] !== false;
          this.showConnectionTile = res.visibility['connection'] !== false;
          this.showLogsTile = res.visibility['logs'] !== false;
          this.showUptimeTile = res.visibility['uptime'] !== false;
          this.showActivityTile = res.visibility['activity'] !== false;
        }
      }
    });
  }

  onTileDrop(event: CdkDragDrop<TileType[]>): void {
    moveItemInArray(this.tileOrder, event.previousIndex, event.currentIndex);
    
    // Then persist to backend with error handling
    this.tileStateService.setTileOrder('user1', this.tileOrder)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            // Optionally show a message that the save failed
            console.warn('Failed to save tile order');
          }
        },
        error: (err) => {
          console.error('Error saving tile order:', err);
          // Optionally show an error message to the user
        }
      });
  }

  // Method to toggle tile visibility
  toggleTileVisibility(tileType: TileType): void {
    // Update local state based on tile type
    switch(tileType) {
      case 'metrics':
        this.showMetricsTile = !this.showMetricsTile;
        break;
      case 'connection':
        this.showConnectionTile = !this.showConnectionTile;
        break;
      case 'logs':
        this.showLogsTile = !this.showLogsTile;
        break;
      case 'uptime':
        this.showUptimeTile = !this.showUptimeTile;
        break;
      case 'activity':
        this.showActivityTile = !this.showActivityTile;
        break;
    }
    
    // Persist visibility settings
    const visibility = {
      metrics: this.showMetricsTile,
      connection: this.showConnectionTile,
      logs: this.showLogsTile,
      uptime: this.showUptimeTile,
      activity: this.showActivityTile,
      kablan: true // Add the missing property
    };
    
    this.tileStateService.setTileVisibility('user1', visibility)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn('Failed to save tile visibility');
          }
        },
        error: (err) => {
          console.error('Error saving tile visibility:', err);
        }
      });
  }
}
