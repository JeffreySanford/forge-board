import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip'; // Import MatTooltipModule

// CDK Modules
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';

// Custom Directives
import { LetterAnimatorDirective } from '../letter-animator.directive';

// Import Shared Modules
import { StorageTypeIndicatorModule } from './components/storage-type-indicator/storage-type-indicator.module';

@NgModule({
  declarations: [
    LetterAnimatorDirective,
  ],
  imports: [
    // Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StorageTypeIndicatorModule,
    
    // Angular Material modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatSliderModule,
    MatChipsModule,
    MatTooltipModule, // Add MatTooltipModule to imports
    
    // CDK modules
    DragDropModule,
    LayoutModule
  ],
  exports: [
    // Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    
    // Angular Material modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatSliderModule,
    MatChipsModule,
    MatTooltipModule, // Add MatTooltipModule to exports
    
    // CDK modules
    DragDropModule,
    LayoutModule,
    
    // Directives
    LetterAnimatorDirective,
  ]
})
export class SharedModule { 
  // Static method to enable SharedModule to provide routes in feature modules
  static forChild(routes: Routes): ModuleWithProviders<RouterModule> {
    return RouterModule.forChild(routes);
  }
}
