import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import all necessary Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';

// Import CDK modules
import { DragDropModule } from '@angular/cdk/drag-drop';

// Import tile modules instead of components
import { ActivityFeedModule } from './tiles/activity-feed/activity-feed.module';
import { ConnectionStatusTileModule } from './tiles/connection-status/connection-status.module';
import { CpuHistoryModule } from './tiles/cpu-history/cpu-history.module';
import { DiskUsageModule } from './tiles/disk-usage/disk-usage.module';
import { MemoryDonutModule } from './tiles/memory-donut/memory-donut.module';
import { NetworkTrafficModule } from './tiles/network-traffic/network-traffic.module';
import { RecentLogsModule } from './tiles/recent-logs/recent-logs.module';
import { SystemHealthModule } from './tiles/system-health/system-health.module';
import { UptimeSummaryModule } from './tiles/uptime-summary/uptime-summary.module';

// Import necessary modules
import { LoggerModule } from '../../components/logger/logger.module';
import { MetricModule } from './metric.module'; // Import MetricModule

@NgModule({
  declarations: [
    DiagnosticsComponent
    // Removed tile components to avoid duplicate declarations
  ],  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add schema for custom elements
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    
    // Angular Material modules
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    
    // CDK modules
    DragDropModule,
    
    // Feature modules
    LoggerModule,
    MetricModule,    // Tile modules
    ActivityFeedModule,
    ConnectionStatusTileModule,
    CpuHistoryModule,
    DiskUsageModule,
    MemoryDonutModule,
    NetworkTrafficModule,
    RecentLogsModule,
    SystemHealthModule,    UptimeSummaryModule
  ],
  exports: [
    DiagnosticsComponent
    // Removed tile component exports to avoid duplicate exports
  ]
})
export class MetricsModule { }