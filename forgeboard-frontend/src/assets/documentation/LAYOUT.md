# ForgeBoard: Blueprint UI Dashboard

## Dashboard Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  Page Container                                                    │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                                                                ││
│  │  Content Wrapper                                               ││
│  │  ┌────────────────────────────────────────────────────────────┐││
│  │  │                                                            │││
│  │  │  Header                                                    │││
│  │  │  ┌────────────────────────────────────────────────────────┐│││
│  │  │  │                                                        ││││
│  │  │  └────────────────────────────────────────────────────────┘│││
│  │  │                                                            │││
│  │  │  Navigation                                                │││
│  │  │  ┌────────────────────────────────────────────────────────┐│││
│  │  │  │                                                        ││││
│  │  │  └────────────────────────────────────────────────────────┘│││
│  │  │                                                            │││
│  │  │  Layout Container                                          │││
│  │  │  ┌────────────────────────────────────────────────────────┐│││
│  │  │  │                                                        ││││
│  │  │  │  Tile Grid Container                                   ││││
│  │  │  │  ┌────────────────────────────────────────────────────┐││││
│  │  │  │  │                                                    ││││││
│  │  │  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         ││││││
│  │  │  │  │  │          │  │          │  │          │         ││││││
│  │  │  │  │  │ Metrics  │  │Connection│  │  Logs    │         ││││││
│  │  │  │  │  │   Tile   │  │   Tile   │  │   Tile   │         ││││││
│  │  │  │  │  │          │  │          │  │          │         ││││││
│  │  │  │  │  └──────────┘  └──────────┘  └──────────┘         ││││││
│  │  │  │  │                                                    ││││││
│  │  │  │  │  ┌──────────┐  ┌──────────┐                        ││││││
│  │  │  │  │  │          │  │          │                        ││││││
│  │  │  │  │  │  Uptime  │  │ Activity │                        ││││││
│  │  │  │  │  │   Tile   │  │   Tile   │                        ││││││
│  │  │  │  │  │          │  │          │                        ││││││
│  │  │  │  │  └──────────┘  └──────────┘                        ││││││
│  │  │  │  │                                                    ││││││
│  │  │  │  └────────────────────────────────────────────────────┘│││
│  │  │  │                                                        ││││
│  │  │  └────────────────────────────────────────────────────────┘││
│  │  │                                                            │││
│  │  │  Footer                                                    │││
│  │  │  ┌────────────────────────────────────────────────────────┐│││
│  │  │  │                                                        ││││
│  │  │  └────────────────────────────────────────────────────────┘│││
│  │  │                                                            │││
│  │  └────────────────────────────────────────────────────────────┘││
│  │                                                                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Dashboard Tile System

ForgeBoard uses a flexible tile-based dashboard system that allows components to be arranged in a grid layout.

### Available Tiles

| Tile Type | Component | Description | Default Size |
|-----------|-----------|-------------|--------------|
| Metrics | `metric.component` | System performance metrics | Medium |
| Connection | `connection-status.component` | Backend connection status | Small |
| Logs | `recent-logs.component` | Latest system log entries | Medium |
| Uptime | `uptime-summary.component` | System uptime statistics | Small |
| Activity | `activity-feed.component` | Recent user and system activity | Medium |

### Tile Features

Each tile in the dashboard implements:

1. **Standard Layout**: Consistent header, body, and footer sections
2. **Drag & Drop**: Repositionable via Angular CDK drag/drop
3. **Persistence**: Layout positions saved via TileStateService
4. **Visibility Toggle**: Can be shown/hidden via UI controls
5. **Mock Data Handling**: Visual indicators when using simulated data

### Tile Drag & Drop

Tiles can be reordered using the Angular CDK drag/drop module:

```typescript
@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html'
})
export class DiagnosticsComponent {
  // Tile order tracked in component
  tileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
  
  // Handle tile drop events to reorder
  onTileDrop(event: CdkDragDrop<TileType[]>): void {
    moveItemInArray(this.tileOrder, event.previousIndex, event.currentIndex);
    // Persist the new order
    this.tileStateService.setTileOrder(this.userId, this.tileOrder);
  }
}
```

## Layout Visualization Tools

ForgeBoard includes several visualization tools to aid development:

### Grid Overlays

- **12-Column Grid**: Traditional 12-column layout visualization
- **4-Column Grid**: Simplified 4-column layout visualization
- **Small Grid**: Fine-grained background grid for detailed alignment
- **Large Grid**: Coarse background grid for broad layout planning

### Blueprint Visual Indicators

- **Center Lines**: Horizontal and vertical center indicators
- **Container Borders**: Visual indicators for layout container boundaries
- **Container Labels**: Text labels for identifying layout containers

### Layout Controls

```html
<div class="controls-row">
  <div class="layout-icon" (click)="toggleLayoutMode()">
    <mat-icon>grid_on</mat-icon>
  </div>
  <div class="layout-icon" (click)="toggle12ColumnOverlay()" [class.active]="is12ColumnVisible">
    <mat-icon>view_column</mat-icon>
    <span class="layout-indicator">12</span>
  </div>
  <div class="layout-icon" (click)="toggle4ColumnOverlay()" [class.active]="is4ColumnVisible">
    <mat-icon>view_column</mat-icon>
    <span class="layout-indicator">4</span>
  </div>
  <!-- Additional controls -->
</div>
```

## Responsive Design

The layout system implements responsive design at multiple breakpoints:

```scss
// Responsive breakpoints for tile grid
@media (max-width: 1700px) {
  .tile-grid > * {
    flex: 1 1 calc(25% - 2em);
    max-width: calc(25% - 2em);
  }
}

@media (max-width: 1400px) {
  .tile-grid > * {
    flex: 1 1 calc(33.333% - 2em);
    max-width: calc(33.333% - 2em);
  }
}

@media (max-width: 1100px) {
  .tile-grid > * {
    flex: 1 1 calc(50% - 2em);
    max-width: calc(50% - 2em);
  }
}

@media (max-width: 700px) {
  .tile-grid > * {
    flex: 1 1 calc(100% - 2em);
    max-width: calc(100% - 2em);
  }
  
  .tile-grid {
    flex-direction: column;
  }
}
```

## Component-Specific Layouts

### Metrics Dashboard

The metrics dashboard uses a split layout:

```
┌─────────────────────────────────────────────────────────────┐
│ .metrics-dashboard                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .dashboard-header                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .metrics-grid                                           │ │
│ │ ┌───────────────────────┐ ┌─────────────────────────┐   │ │
│ │ │ .main-metrics         │ │ .metrics-tiles          │   │ │
│ │ │ (Charts & Stats)      │ │ (Diagnostic Tiles)      │   │ │
│ │ └───────────────────────┘ └─────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Kablan Board

The Kablan board uses a phase-based layout:

```
┌─────────────────────────────────────────────────────────────┐
│ .kablan-board                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .kablan-toolbar                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .project-phases (Timeline visualization)                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .board-navigation                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .kablan-columns (Horizontally scrollable)               │ │
│ │                                                         │ │
│ │ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│ │ │ Column  │  │ Column  │  │ Column  │  │ Column  │      │ │
│ │ │ Header  │  │ Header  │  │ Header  │  │ Header  │      │ │
│ │ ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤      │ │
│ │ │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │      │ │
│ │ │ │Card │ │  │ │Card │ │  │ │Card │ │  │ │Card │ │      │ │
│ │ │ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │      │ │
│ │ │ ┌─────┐ │  │ ┌─────┐ │  │         │  │         │      │ │
│ │ │ │Card │ │  │ │Card │ │  │         │  │         │      │ │
│ │ │ └─────┘ │  │ └─────┘ │  │         │  │         │      │ │
│ │ │ ┌─────┐ │  │         │  │         │  │         │      │ │
│ │ │ │Card │ │  │         │  │         │  │         │      │ │
│ │ │ └─────┘ │  │         │  │         │  │         │      │ │
│ │ └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .pagination-indicator                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Diagnostics Display

The diagnostics screen uses a vertical section-based layout:

```
┌─────────────────────────────────────────────────────────────┐
│ .diagnostic-container                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .health-section                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .socket-section                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .active-sockets-section                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .socket-logs-section                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .services-section                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## CSS Architecture

ForgeBoard uses a consistent CSS architecture:

### Global Structure

- **Container Classes**: `.page-container`, `.content-wrapper`, `.layout-container`
- **Grid Classes**: `.tile-grid-container`, `.tile-grid`
- **Utility Classes**: `.fieldset-label`, `.hide-border`

### Component Styling

- **BEM-Influenced**: Block, Element, Modifier approach
- **SCSS Variables**: Used for consistent colors and spacing
- **Nested Selectors**: Organized by component hierarchy
- **Animation Classes**: Applied for transitions and states

### Animation System

```scss
@keyframes drawOutline {
  from { stroke-dashoffset: 640; }
  to { stroke-dashoffset: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  from { filter: brightness(1); }
  to { filter: brightness(2); }
}
```

## Blueprint Design Elements

Key visual aspects of the blueprint design:

1. **Thin Border Lines**: Precise boundaries for layout containers
2. **Grid Overlays**: Visual guides for alignment
3. **Label Annotations**: Small text labels for containers
4. **Color Scheme**: Blue (#3498db) primary, with accent colors
5. **Monospace Fonts**: For data, metrics, and technical information
