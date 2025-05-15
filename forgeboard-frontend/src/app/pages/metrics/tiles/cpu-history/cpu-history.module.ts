import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpuHistoryComponent } from './cpu-history.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [CpuHistoryComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  exports: [CpuHistoryComponent]
})
export class CpuHistoryModule { }
