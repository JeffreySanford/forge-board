import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    FooterComponent
  ],
  imports: [
    CommonModule,
    SharedModule // This should import the LetterAnimatorDirective
  ],
  exports: [
    FooterComponent
  ]
})
export class FooterModule { }
