import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UptimeSummaryComponent } from './uptime-summary.component';

@NgModule({
  declarations: [UptimeSummaryComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [UptimeSummaryComponent]
})
export class UptimeSummaryModule { }
