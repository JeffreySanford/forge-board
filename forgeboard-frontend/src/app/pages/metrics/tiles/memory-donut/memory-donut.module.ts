import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MemoryDonutComponent } from './memory-donut.component';

@NgModule({
  declarations: [MemoryDonutComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  exports: [MemoryDonutComponent]
})
export class MemoryDonutModule { }
