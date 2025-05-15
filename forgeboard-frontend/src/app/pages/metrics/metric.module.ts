import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MetricComponent } from './metric.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { MetricsService } from '../../services/metrics.service';
import { BackendStatusService } from '../../services/backend-status.service';
import { RefreshIntervalService } from '../../services/refresh-interval.service';

// Import any Angular Material modules that might be used in the template
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [MetricComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: MetricComponent }]), // Assuming it's a routed component
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  providers: [
    MetricsService, // Ensure services are provided if not already provided in root
    BackendStatusService,
    RefreshIntervalService
  ],
  exports: [MetricComponent]
})
export class MetricModule { }
