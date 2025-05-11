import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { DiagnosticsComponent } from './diagnostics.component';
import { DiagnosticsService } from './diagnostics.service';
import { JwtDiagnosticsModule } from '../../components/jwt-diagnostics/jwt-diagnostics.module'; // Import JwtDiagnosticsModule

@NgModule({
  declarations: [DiagnosticsComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
    JwtDiagnosticsModule, // Add JwtDiagnosticsModule to imports
  ],
  exports: [DiagnosticsComponent],
  providers: [DiagnosticsService]
})
export class DiagnosticsModule { }
