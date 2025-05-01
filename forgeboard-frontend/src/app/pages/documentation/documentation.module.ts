import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DocumentationComponent } from './documentation.component';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [
    DocumentationComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatTabsModule,
    RouterModule.forChild([
      { path: 'documentation', component: DocumentationComponent }
    ])
  ],
  exports: [
    DocumentationComponent
  ]
})
export class DocumentationModule { }
