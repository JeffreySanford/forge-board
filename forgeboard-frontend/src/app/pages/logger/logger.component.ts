import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogEntry, LogLevel, LogFilter } from '@forge-board/shared/api-interfaces';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss']
})
export class LoggerComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  stats: Record<LogLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0
  };
  
  isConnected = false;
  filter: LogFilter = {
    levels: ['debug', 'info', 'warn', 'error', 'fatal'],
    sources: [],
    startTime: null,
    endTime: null,
    search: ''
  };
  availableSources: string[] = [];
  
  private subscriptions = new Subscription();
  
  constructor(private loggerService: LoggerService) {}
  
  ngOnInit(): void {
    // Subscribe to logs
    this.subscriptions.add(
      this.loggerService.getLogs().subscribe(logs => {
        this.logs = logs;
        
        // Extract unique sources
        const sources = new Set<string>();
        logs.forEach(log => sources.add(log.source));
        this.availableSources = Array.from(sources);
      })
    );
    
    // Subscribe to stats
    this.subscriptions.add(
      this.loggerService.getLogStats().subscribe(stats => {
        this.stats = stats;
      })
    );
    
    // Subscribe to connection status
    this.subscriptions.add(
      this.loggerService.getConnectionStatus().subscribe(connected => {
        this.isConnected = connected;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Handle level filter changes
   */
  onLevelsChanged(levels: LogLevel[]): void {
    this.loggerService.updateFilter({ levels });
  }
  
  /**
   * Handle source filter changes
   */
  onSourcesChanged(sources: string[]): void {
    this.loggerService.updateFilter({ sources });
  }
  
  /**
   * Handle search text changes
   */
  onSearchChanged(search: string): void {
    this.loggerService.updateFilter({ search });
  }
  
  /**
   * Handle date range changes
   */
  onDateRangeChanged(range: { start: string | null; end: string | null }): void {
    this.loggerService.updateFilter({
      startTime: range.start,
      endTime: range.end
    });
  }
  
  /**
   * Export logs to JSON
   */
  exportLogsToJson(): void {
    this.loggerService.exportLogsToJson();
  }
  
  /**
   * Export logs to CSV
   */
  exportLogsToCsv(): void {
    this.loggerService.exportLogsToCsv();
  }
}
