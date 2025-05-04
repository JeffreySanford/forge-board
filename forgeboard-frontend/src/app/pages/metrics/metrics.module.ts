import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricComponent } from './metric.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ActivityFeedComponent } from './tiles/activity-feed/activity-feed.component';
import { ConnectionStatusComponent } from './tiles/connection-status/connection-status.component';
import { CpuHistoryComponent } from './tiles/cpu-history/cpu-history.component';
import { DiskUsageComponent } from './tiles/disk-usage/disk-usage.component';
import { MemoryDonutComponent } from './tiles/memory-donut/memory-donut.component';
import { NetworkTrafficComponent } from './tiles/network-traffic/network-traffic.component';
import { RecentLogsComponent } from './tiles/recent-logs/recent-logs.component';
import { SystemHealthComponent } from './tiles/system-health/system-health.component';
import { UptimeSummaryComponent } from './tiles/uptime-summary/uptime-summary.component';
import { LoggerModule } from '../../components/logger/logger.module';

@NgModule({
  declarations: [
    MetricComponent,
    DiagnosticsComponent,
    ActivityFeedComponent,
    ConnectionStatusComponent,
    CpuHistoryComponent,
    DiskUsageComponent,
    MemoryDonutComponent,
    NetworkTrafficComponent,
    RecentLogsComponent,
    SystemHealthComponent,
    UptimeSummaryComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatButtonToggleModule,
    DragDropModule,
    LoggerModule
  ],
  exports: [
    MetricComponent,
    DiagnosticsComponent
  ]
})
export class MetricsModule { }