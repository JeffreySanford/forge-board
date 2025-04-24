import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    FooterComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    SharedModule // Add SharedModule to imports
  ],
  exports: [
    FooterComponent
  ]
})
export class FooterModule { }
