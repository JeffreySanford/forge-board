import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu'; // Ensure MatMenuModule is imported

// Import components
import { LoggerComponent } from './logger.component';
import { LoggerViewComponent } from './logger-view.component'; // Added LoggerViewComponent import
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { LogFilterComponent } from './components/log-filter/log-filter.component';
import { LogLevelSelectorComponent } from './components/log-level-selector/log-level-selector.component';
import { LogStatisticsComponent } from './components/log-statistics/log-statistics.component';
import { LogSearchComponent } from './components/log-search/log-search.component';
import { LoggerModule as ComponentsLoggerModule } from '../../components/logger/logger.module';
import { LogExportComponent } from './components/log-export/log-export.component';// Import standalone component

@NgModule({
  declarations: [
    LoggerComponent,
    LoggerViewComponent, // Added LoggerViewComponent
    LogViewerComponent,
    LogFilterComponent,
    LogStatisticsComponent,
    LogSearchComponent,
    LogLevelSelectorComponent,
    LogExportComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ComponentsLoggerModule, // Import the LoggerModule from components
    
    // Import all Material modules
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule // Ensure MatMenuModule is in imports
  ],  exports: [
    LoggerComponent,
    LoggerViewComponent
  ]
})
export class LoggerModule { }
