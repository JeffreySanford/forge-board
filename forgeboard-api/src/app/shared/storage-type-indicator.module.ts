import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StorageTypeIndicatorComponent } from './storage-type-indicator.component';

@NgModule({
  declarations: [StorageTypeIndicatorComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [StorageTypeIndicatorComponent]
})
export class StorageTypeIndicatorModule {}
