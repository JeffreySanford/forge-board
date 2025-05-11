import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SystemHealthComponent } from './system-health.component';

@NgModule({
  declarations: [SystemHealthComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  exports: [SystemHealthComponent]
})
export class SystemHealthModule { }
