import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { StorageTypeIndicatorComponent } from './storage-type-indicator.component';

@NgModule({
  declarations: [StorageTypeIndicatorComponent],
  imports: [
    CommonModule,
    MatTooltipModule,
    MatIconModule
  ],
  exports: [StorageTypeIndicatorComponent]
})
export class StorageTypeIndicatorModule { }
