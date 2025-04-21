import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsInfographicComponent } from './metrics-infographic.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MetricsService } from './metrics.service';

@NgModule({
  declarations: [MetricsInfographicComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule
  ],
  providers: [
    MetricsService
  ],
  exports: [MetricsInfographicComponent]
})
export class MetricsInfographicModule {}