import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityDashboardComponent } from './security-dashboard.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [SecurityDashboardComponent],
  imports: [CommonModule, MatCardModule],
  exports: [SecurityDashboardComponent]
})
export class SecurityDashboardModule {}
