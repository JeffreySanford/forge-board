import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { LoggerService } from './logger.service';
import { LogFilterComponent } from './components/log-filter/log-filter.component';
import { LogSearchComponent } from './components/log-search/log-search.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { LogStatisticsComponent } from './components/log-statistics/log-statistics.component';
import { LogExportComponent } from './components/log-export/log-export.component';

import { LogEntry, LogFilter, LogLevelEnum } from '@forge-board/shared/api-interfaces';
import { LogLevel } from '../../services/logger.service';

interface LogStat {
  level: LogLevel;
  count: number;
}

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule,
    LogFilterComponent,
    LogSearchComponent,
    LogViewerComponent,
    LogStatisticsComponent,
    LogExportComponent
  ]
})
export class LoggerComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  logStats: LogStat[] = [];
  selectedLevels: LogLevelEnum[] = [
    LogLevelEnum.DEBUG, 
    LogLevelEnum.INFO, 
    LogLevelEnum.WARN,
    LogLevelEnum.ERROR,
    LogLevelEnum.FATAL
  ];
  selectedService = '';
  searchQuery = '';
  autoRefresh = true;
  
  private destroy$ = new Subject<void>();

  constructor(private loggerService: LoggerService) {}

  ngOnInit(): void {
    // Subscribe to logs
    this.loggerService.getLogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.logs = logs;
      });
    
    // Subscribe to log stats
    this.loggerService.getLogStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.logStats = Object.entries(stats).map(([level, count]) => ({
          level: parseInt(level, 10) as LogLevel,
          count
        }));
      });
    
    // Refresh logs initially
    this.refreshLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  refreshLogs(): void {
    // Create a filter object
    const filter: LogFilter = {
      level: this.selectedLevels,
      service: this.selectedService || undefined,
      search: this.searchQuery || undefined
    };
    
    // Update the filter
    this.loggerService.updateFilter(filter);
  }
  
  onLevelsChanged(levels: LogLevelEnum[]): void {
    this.selectedLevels = levels;
    this.refreshLogs();
  }
  
  onSourcesChanged(service: string): void {
    this.selectedService = service;
    this.refreshLogs();
  }
  
  onSearchChanged(search: string): void {
    this.searchQuery = search;
    this.refreshLogs();
  }
  
  onAutoRefreshChanged(enabled: boolean): void {
    this.autoRefresh = enabled;
  }
  
  onExportJson(): void {
    this.loggerService.exportLogsToJson();
  }
  
  onExportCsv(): void {
    this.loggerService.exportLogsToCsv();
  }
  
  /**
   * Apply a basic filter to logs
   * This method uses the base LogFilter interface for backward compatibility
   */
  applyBasicFilter(): void {
    // Create a basic LogFilter without advanced properties
    const basicFilter: LogFilter = {
      level: this.selectedLevels,
      service: this.selectedService || undefined,
      search: this.searchQuery || undefined
    };
    
    // Apply the filter through the logger service (assuming it supports LogFilter)
    this.loggerService.filterLogsByBasicFilter(basicFilter);
    
    this.debug(`Applied basic filter: ${JSON.stringify(basicFilter)}`);
  }
  
  /**
   * Debug helper method
   */
  private debug(message: string): void {
    if (console && console.debug) {
      console.debug(`[LoggerComponent] ${message}`);
    }
  }
}
