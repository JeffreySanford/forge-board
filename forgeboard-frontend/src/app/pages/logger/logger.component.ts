import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LogEntry, LogLevelEnum } from '@forge-board/shared/api-interfaces';
import { LoggerService } from './logger.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// Import the necessary components
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { LogSearchComponent } from './components/log-search/log-search.component';
import { LogLevelSelectorComponent } from './components/log-level-selector/log-level-selector.component';
import { LogFilterComponent } from './components/log-filter/log-filter.component';
import { LogStatisticsComponent } from './components/log-statistics/log-statistics.component';
import { LogExportComponent } from './components/log-export/log-export.component';

// Import local LogLevel enum
import { LogLevel } from './log-types';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    LogViewerComponent,
    LogSearchComponent,
    LogLevelSelectorComponent,
    LogFilterComponent,
    LogStatisticsComponent,
    LogExportComponent
  ]
})
export class LoggerComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  logStats: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
    [LogLevel.FATAL]: 0,
    [LogLevel.TRACE]: 0  // Add missing TRACE level
  };
  selectedLevels: LogLevelEnum[] = []; // Ensure this is always an array
  selectedService = '';
  isConnected = false;
  private subscriptions = new Subscription();

  constructor(public loggerService: LoggerService) {}

  ngOnInit(): void {
    // Subscribe to logs
    this.subscriptions.add(
      this.loggerService.getLogs().subscribe(logs => {
        this.logs = logs;
      })
    );
    
    // Subscribe to log stats
    this.subscriptions.add(
      this.loggerService.getLogStats().subscribe(stats => {
        this.logStats = stats;
      })
    );
    
    // Subscribe to connection status
    this.subscriptions.add(
      this.loggerService.getConnectionStatus().subscribe(isConnected => {
        this.isConnected = isConnected;
      })
    );
    
    // Initialize selected levels from current filter
    const currentFilter = this.loggerService.getCurrentFilter();
    if (currentFilter.level) {
      this.selectedLevels = Array.isArray(currentFilter.level) 
        ? currentFilter.level 
        : [currentFilter.level];
    }
    
    // Initialize selected service
    this.selectedService = currentFilter.service || '';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Handle level filter changes
   */
  onLevelsChanged(levels: LogLevelEnum[]): void {
    // Updated to use level instead of levels
    this.selectedLevels = levels; // Update local state
    this.loggerService.updateFilter({ level: levels });
  }
  
  /**
   * Handle source filter changes
   */
  onSourcesChanged(service: string): void {
    // Updated to use service instead of sources
    this.selectedService = service; // Update local state
    this.loggerService.updateFilter({ service });
  }
  
  /**
   * Handle search filter changes
   */
  onSearchChanged(search: string): void {
    // Use the string value directly instead of trying to access it from an Event object
    this.loggerService.updateFilter({ search: search || undefined });
  }
  
  /**
   * Handle date filter changes
   */
  onDateRangeChanged(dateRange: { startDate: string | null; endDate: string | null }): void {
    // Convert null to undefined for type compatibility
    const startDate = dateRange.startDate || undefined;
    const endDate = dateRange.endDate || undefined;
    
    this.loggerService.updateFilter({
      startDate,
      endDate
    });
  }

  /**
   * Handle JSON export
   */
  onExportJson(): void {
    this.loggerService.exportLogsToJson();
  }

  /**
   * Handle CSV export
   */
  onExportCsv(): void {
    this.loggerService.exportLogsToCsv();
  }
}
