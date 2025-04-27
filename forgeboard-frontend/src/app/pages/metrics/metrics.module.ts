import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop'; // Add this import

// Import regular (non-standalone) component
import { ConnectionStatusComponent } from './tiles/connection-status/connection-status.component';
import { MetricComponent } from './metric.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { MetricsService } from '../../services/metrics.service';

// Import components from their tile folders
import { RecentLogsComponent } from './tiles/recent-logs/recent-logs.component';
import { UptimeSummaryComponent } from './tiles/uptime-summary/uptime-summary.component';
import { ActivityFeedComponent } from './tiles/activity-feed/activity-feed.component';

// Import LoggerModule for LoggerTileComponent
import { LoggerModule } from '../../components/logger/logger.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    LoggerModule, 
    DragDropModule, // Add this module
  ],
  declarations: [
    ConnectionStatusComponent,
    MetricComponent,
    DiagnosticsComponent,
    // Only include non-standalone components here
    RecentLogsComponent,
    UptimeSummaryComponent,
    ActivityFeedComponent
  ],
  exports: [
    MetricComponent,
    DiagnosticsComponent
  ],
  providers: [
    MetricsService
  ],
})
export class MetricsModule { }