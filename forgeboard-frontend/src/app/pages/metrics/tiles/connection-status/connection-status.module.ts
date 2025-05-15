import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionStatusComponent } from './connection-status.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [ConnectionStatusComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [ConnectionStatusComponent]
})
export class ConnectionStatusTileModule { }
