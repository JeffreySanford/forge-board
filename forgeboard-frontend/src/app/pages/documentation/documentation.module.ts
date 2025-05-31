import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DocumentationComponent } from './documentation.component';

// Angular Material imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select'; // Add this import
import { DocumentationService } from '@/app/services/documentation.service';

@NgModule({
  declarations: [DocumentationComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    MatTabsModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule, // Add this module
    RouterModule.forChild([{ path: '', component: DocumentationComponent }]),
  ],
  providers: [DocumentationService],
  exports: [DocumentationComponent],
})
export class DocumentationModule {}
