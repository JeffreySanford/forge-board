import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TileType, SocketInfo, DiagnosticEvent } from '@forge-board/shared/api-interfaces';
import { TileStateService } from '../../../services/tile-state.service';
import { Subscription } from 'rxjs';
import { DiagnosticsService } from '../../../services/diagnostics.service';

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  standalone: false
})
export class DiagnosticsComponent implements OnInit, OnDestroy {
  showLayoutBorder = false; // Default to false for production view
  
  // Tile visibility states
  showHealthTile = true;
  showMemoryTile = true;
  showConnectionTile = true;
  showLogsTile = true;
  showUptimeTile = true;
  showActivityTile = true;
  
  // Default order of tiles
  tileOrder: TileType[] = ['health', 'memory', 'connection', 'logs', 'uptime', 'activity'];
  
  // Properties referenced in the template
  health: any = { status: 'unknown', uptime: 0 };
  services: string[] = [];
  controllers: string[] = [];
  gateways: string[] = [];
  errors: string[] = [];
  socketStatus = 'disconnected';
  
  private subscription = new Subscription();

  constructor(
    private tileStateService: TileStateService,
    private diagnosticsService: DiagnosticsService
  ) {}

  ngOnInit(): void {
    // Load tile order from backend
    this.subscription.add(
      this.tileStateService.getTileOrder('user1').subscribe(res => {
        if (res.order && res.order.length) {
          // Check if the order includes our new tiles
          const hasAllTileTypes = ['health', 'memory'].every(
            type => res.order.includes(type as TileType)
          );
          
          // If the stored order doesn't include all our new tiles,
          // merge new tiles with existing order
          if (!hasAllTileTypes) {
            const missingTiles = ['health', 'memory'].filter(
              type => !res.order.includes(type as TileType)
            ) as TileType[];
            
            // Add missing tiles to the beginning
            this.tileOrder = [...missingTiles, ...res.order as TileType[]];
            
            // Save the updated order to persist changes
            this.saveTileOrder();
          } else {
            // Use stored order as-is
            this.tileOrder = res.order as TileType[];
          }
          
          // Apply visibility settings if available
          if (res.visibility) {
            // Add support for new tiles with default of true if not present
            this.showHealthTile = res.visibility['health'] !== false;
            this.showMemoryTile = res.visibility['memory'] !== false;
            this.showConnectionTile = res.visibility['connection'] !== false;
            this.showLogsTile = res.visibility['logs'] !== false;
            this.showUptimeTile = res.visibility['uptime'] !== false;
            this.showActivityTile = res.visibility['activity'] !== false;
          }
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Handle drag and drop reordering of tiles
   */
  onTileDrop(event: CdkDragDrop<TileType[]>): void {
    moveItemInArray(this.tileOrder, event.previousIndex, event.currentIndex);
    this.saveTileOrder();
  }
  
  /**
   * Save the current tile order to the backend
   */
  saveTileOrder(): void {
    this.tileStateService.setTileOrder('user1', this.tileOrder)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn('Failed to save tile order');
          }
        },
        error: (err) => {
          console.error('Error saving tile order:', err);
        }
      });
  }

  /**
   * Toggle visibility of a specific tile
   */
  toggleTileVisibility(tileType: TileType): void {
    // Update local state based on tile type
    switch(tileType) {
      case 'health':
        this.showHealthTile = !this.showHealthTile;
        break;
      case 'memory':
        this.showMemoryTile = !this.showMemoryTile;
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
    
    this.saveTileVisibility();
  }
  
  /**
   * Toggle layout border visibility (for development/design purposes)
   */
  toggleLayoutBorder(): void {
    this.showLayoutBorder = !this.showLayoutBorder;
  }
  
  /**
   * Reset tile layout to default order and visibility
   */
  resetTileLayout(): void {
    // Reset to default order
    this.tileOrder = ['health', 'memory', 'connection', 'logs', 'uptime', 'activity'];
    
    // Reset visibility (all tiles visible by default)
    this.showHealthTile = true;
    this.showMemoryTile = true;
    this.showConnectionTile = true;
    this.showLogsTile = true;
    this.showUptimeTile = true;
    this.showActivityTile = true;
    
    // Save both order and visibility
    this.saveTileOrder();
    this.saveTileVisibility();
  }
  
  /**
   * Save tile visibility settings to backend
   */
  saveTileVisibility(): void {
    const visibility = {
      health: this.showHealthTile,
      memory: this.showMemoryTile,
      metrics: true, // Set to true or bind to a variable if you have one
      connection: this.showConnectionTile,
      logs: this.showLogsTile,
      uptime: this.showUptimeTile,
      activity: this.showActivityTile,
      kablan: true // Set to true or bind to a variable if you have one
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

  getEventTypeClass(type: string): string {
    switch (type) {
      case 'error': return 'event-error';
      case 'warning': return 'event-warning';
      case 'info': return 'event-info';
      default: return 'event-default';
    }
  }
}
