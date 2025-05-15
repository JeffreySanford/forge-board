import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NetworkTrafficComponent } from './network-traffic.component';

@NgModule({
  declarations: [NetworkTrafficComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  exports: [NetworkTrafficComponent]
})
export class NetworkTrafficModule { }
