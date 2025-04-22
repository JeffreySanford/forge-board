import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TileType } from '@forge-board/shared/api-interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TileStateService } from '../../../services/tile-state.service';

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  standalone: false
})
export class DiagnosticsComponent implements OnInit, OnDestroy {
  showLayoutBorder = true;
  showMetricsTile = true;
  tileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
  private subscriptions = new Subscription();

  constructor(private tileStateService: TileStateService) {}

  ngOnInit(): void {
    // Load tile order from backend
    const sub = this.tileStateService.getTileOrder('user1').subscribe(res => {
      if (res.order && res.order.length) {
        this.tileOrder = res.order as TileType[];
        
        // Apply visibility settings if available
        if (res.visibility) {
          this.showMetricsTile = res.visibility['metrics'] !== false;
          // Update other visibility flags as needed
        }
      }
    });
    
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onTileDrop(event: CdkDragDrop<TileType[]>): void {
    // First update the local array for immediate UI feedback
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
    if (tileType === 'metrics') {
      this.showMetricsTile = !this.showMetricsTile;
    }
    // Add similar toggles for other tile types as needed
    
    // Persist visibility settings
    const visibility = {
      metrics: this.showMetricsTile,
      connection: true, // Update with actual visibility states
      logs: true,
      uptime: true,
      activity: true
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
