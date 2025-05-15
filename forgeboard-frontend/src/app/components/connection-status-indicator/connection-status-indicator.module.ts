import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConnectionStatusIndicatorComponent } from './connection-status-indicator.component';

@NgModule({
  declarations: [ConnectionStatusIndicatorComponent],
  imports: [CommonModule, MatIconModule, MatButtonModule],
  exports: [ConnectionStatusIndicatorComponent]
})
export class ConnectionStatusIndicatorModule {}
