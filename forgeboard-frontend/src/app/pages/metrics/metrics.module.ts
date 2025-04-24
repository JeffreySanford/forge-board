import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MetricComponent } from './metric.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { MetricsService } from '../../services/metrics.service';

// Import components from their tile folders
import { ConnectionStatusComponent } from './tiles/connection-status/connection-status.component';
import { RecentLogsComponent } from './tiles/recent-logs/recent-logs.component';
import { UptimeSummaryComponent } from './tiles/uptime-summary/uptime-summary.component';
import { ActivityFeedComponent } from './tiles/activity-feed/activity-feed.component';

// Import LoggerModule for LoggerTileComponent
import { LoggerModule } from '../../components/logger/logger.module';

@NgModule({
  declarations: [
    MetricComponent,
    DiagnosticsComponent,
    // Only include non-standalone components here
    RecentLogsComponent,
    UptimeSummaryComponent,
    ActivityFeedComponent,
    ConnectionStatusComponent
  ],
  imports: [
    SharedModule,
    LoggerModule, // Add LoggerModule here
    // Route configuration
    SharedModule.forChild([
      { path: '', component: DiagnosticsComponent }
    ])
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