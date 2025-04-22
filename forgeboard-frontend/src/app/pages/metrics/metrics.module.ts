import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricComponent } from './metric.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';
import { MetricsService } from '../../services/metrics.service';

// Import components from correct paths
import { MetricsInfographicComponent } from './components/metrics-infographic.component';
import { ConnectionStatusComponent } from './components/connection-status.component';

@NgModule({
  declarations: [
    MetricComponent,
    DiagnosticsComponent,
    // Include components
    MetricsInfographicComponent,
    ConnectionStatusComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    FormsModule,
    DragDropModule,
    RouterModule.forChild([
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