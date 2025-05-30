import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypeDiagnosticsComponent } from './type-diagnostics.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  declarations: [TypeDiagnosticsComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule
  ],
  exports: [TypeDiagnosticsComponent]
})
export class TypeDiagnosticsModule { }
