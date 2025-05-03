import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { LogEntry, LogLevelEnum, logLevelEnumToString } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-logger-tile',
  templateUrl: './logger-tile.component.html',
  styleUrls: ['./logger-tile.component.scss'],
  standalone: false
})
export class LoggerTileComponent implements OnInit {
  @Input() logs$!: Observable<LogEntry[]>;
  @Input() compact: boolean = false;
  @Input() maxItems: number = 100;
  @Input() source: string = 'all';

  // Form controls
  searchControl = new FormControl<string>('');
  levelFilter = new FormControl<LogLevelEnum[]>([LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR]);
  searchFilter = new FormControl<string>('');
  
  // Available log levels
  readonly logLevels: LogLevelEnum[] = [LogLevelEnum.DEBUG, LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR];

  // Filtered logs observable
  filteredLogs$!: Observable<LogEntry[]>;

  ngOnInit(): void {
    // Initialize logs$ if not provided
    if (!this.logs$) {
      this.logs$ = of([]);
    }

    // Setup filtered logs observable
    this.setupFilteredLogsObservable();
  }

  /**
   * Set up filtered logs observable combining all filters
   */
  private setupFilteredLogsObservable(): void {
    // Listen for logs, search input, and level filter
    this.filteredLogs$ = combineLatest([
      this.logs$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.levelFilter.valueChanges.pipe(
        startWith<LogLevelEnum[] | null>(this.levelFilter.value),
        map(value => (value || [LogLevelEnum.INFO, LogLevelEnum.WARN, LogLevelEnum.ERROR]))
      )
    ]).pipe(
      map(([logs, search, levels]) => this.filterLogs(logs, search || '', levels))
    );
  }

  /**
   * Filter logs based on search text and selected levels
   */
  filterLogs(logs: LogEntry[], search: string, levels: LogLevelEnum[]): LogEntry[] {
    return logs
      // Filter by selected levels
      .filter(log => levels.includes(log.level))
      // Filter by search text
      .filter(log => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          log.message.toLowerCase().includes(searchLower) ||
          (log.source ?? '').toLowerCase().includes(searchLower) ||
          logLevelEnumToString(log.level).toLowerCase().includes(searchLower)
        );
      })
      // Limit number of logs displayed
      .slice(0, this.maxItems);
  }

  /**
   * Check if a log level is currently selected in the filter
   */
  isLevelSelected(level: LogLevelEnum): boolean {
    const selectedLevels = this.levelFilter.value || [];
    return selectedLevels.includes(level);
  }

  /**
   * Toggle a log level in the filter
   */
  toggleLevel(level: LogLevelEnum): void {
    const currentLevels = this.levelFilter.value || [];
    
    if (this.isLevelSelected(level)) {
      // Remove level if it's already selected
      this.levelFilter.setValue(currentLevels.filter(l => l !== level));
    } else {
      // Add level if it's not selected
      this.levelFilter.setValue([...currentLevels, level]);
    }
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  /**
   * Get CSS class for log level
   */
  getLevelClass(level: LogLevelEnum): string {
    switch (level) {
      case LogLevelEnum.DEBUG: return 'log-level-debug';
      case LogLevelEnum.INFO: return 'log-level-info';
      case LogLevelEnum.WARN: return 'log-level-warning';
      case LogLevelEnum.ERROR: return 'log-level-error';
      case LogLevelEnum.FATAL: return 'log-level-fatal';
      case LogLevelEnum.TRACE: return 'log-level-trace';
      default: return '';
    }
  }
  
  /**
   * Get string representation of LogLevelEnum for display
   */
  getLogLevelString(level: LogLevelEnum): string {
    return logLevelEnumToString(level);
  }
}
