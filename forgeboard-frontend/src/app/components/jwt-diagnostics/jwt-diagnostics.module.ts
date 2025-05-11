import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';

import { JwtDiagnosticsComponent } from './jwt-diagnostics.component';

@NgModule({
  declarations: [JwtDiagnosticsComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatBadgeModule,
    MatButtonModule
  ],
  exports: [JwtDiagnosticsComponent]
})
export class JwtDiagnosticsModule { }
