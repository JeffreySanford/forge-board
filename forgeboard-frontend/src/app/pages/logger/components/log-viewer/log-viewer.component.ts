import { Component, Input, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoggerService, LogEntry } from '../../logger.service';
import { LogLevelEnum } from '@forge-board/shared/api-interfaces';
import { Subject, interval, takeUntil } from 'rxjs';

type ViewMode = 'standard' | 'grouped' | 'categorized';
type TabType = 'data' | 'analysis' | 'duplicates';

/**
 * Enhanced log viewer component that displays logs in a table format
 * with features for filtering, sorting, and grouping logs.
 */
@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule
  ]
})
export class LogViewerComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() set logs(value: LogEntry[]) {
    this._logs = value || [];
    this.updateAvailableServices();
    this.processLogs();
  }
  
  get logs(): LogEntry[] {
    return this._logs;
  }
  
  private _logs: LogEntry[] = [];
  private _processedLogs: LogEntry[] = [];
  private _filteredLogs: LogEntry[] = [];
  private destroy$ = new Subject<void>();
  
  // Service filtering
  availableServices: string[] = [];
  selectedService: string = 'all';
  
  // Auto-refresh
  autoRefresh = true;
  refreshInterval = 2000; // ms
  
  // Analysis tabs
  activeTab: TabType = 'data';
  
  // Pagination
  pageSize = 25;
  
  displayedColumns: string[] = ['timestamp', 'level', 'source', 'message', 'actions'];
  dataSource = new MatTableDataSource<LogEntry>([]);
  viewMode: ViewMode = 'standard';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(private loggerService: LoggerService) {}
  
  ngOnInit(): void {
    this.processLogs();
    this.setupAutoRefresh();
    
    // Subscribe to new log entries from the service
    this.loggerService.newLogEntry$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(log => {
      if (this.autoRefresh) {
        this.handleNewLogEntry(log);
      }
    });
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom sort for timestamp
    this.dataSource.sortingDataAccessor = (item: LogEntry, property: string): string | number => {
      switch (property) {
        case 'timestamp': {
          return new Date(item.timestamp).getTime();
        }
        default: {
          // Cast to unknown first, then to string|number to satisfy the return type
          const value = (item as unknown as Record<string, string | number>)[property];
          return value !== undefined ? value : '';
        }
      }
    };
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewMode']) {
      this.processLogs();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Set up auto-refresh interval
   */
  setupAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoRefresh) {
          this.refreshData();
        }
      });
  }
  
  /**
   * Handle view mode change
   */
  onViewModeChange(): void {
    this.processLogs();
  }
  
  /**
   * Set active tab for expanded logs
   */
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }
  
  /**
   * Refresh log data
   */
  refreshData(): void {
    // Request latest logs from the service
    this.loggerService.getLatestLogs().subscribe(logs => {
      if (logs && logs.length > 0) {
        // Only update if there are new logs
        if (this._logs.length === 0 || 
            logs[0].id !== this._logs[0].id) {
          this._logs = logs;
          this.updateAvailableServices();
          this.processLogs();
        }
      }
    });
  }
  
  /**
   * Handle a new log entry
   */
  handleNewLogEntry(log: LogEntry): void {
    // Add to the beginning of logs array
    this._logs = [log, ...this._logs];
    
    // Update available services if needed
    if (log.source && !this.availableServices.includes(log.source)) {
      this.updateAvailableServices();
    }
    
    // Re-process logs to apply filtering and grouping
    this.processLogs();
  }
  
  /**
   * Process logs based on current view mode
   */
  processLogs(): void {
    if (!this._logs) return;
    
    // Apply appropriate grouping based on view mode
    switch (this.viewMode) {
      case 'grouped':
        this._processedLogs = this.loggerService.groupLogs(this._logs, false);
        break;
      case 'categorized':
        this._processedLogs = this.loggerService.groupLogs(this._logs, true);
        break;
      default:
        // Standard mode - no grouping
        this._processedLogs = [...this._logs];
    }
    
    // Apply service filtering
    this._filteredLogs = this.selectedService === 'all' 
      ? this._processedLogs 
      : this._processedLogs.filter(log => log.source === this.selectedService);
    
    // Update data source
    if (this.dataSource) {
      this.dataSource.data = this._filteredLogs;
    }
  }
  
  /**
   * Handle row click events
   */
  rowClick(log: LogEntry, event: MouseEvent): void {
    // Don't toggle if clicked on a button (those have their own handlers)
    if (event.target && 
        ((event.target as HTMLElement).tagName === 'BUTTON' ||
        (event.target as HTMLElement).tagName === 'MAT-ICON')) {
      return;
    }
    
    if (log.isCategory) {
      this.expandCategory(log);
    } else {
      this.toggleLogExpansion(log);
    }
  }
  
  /**
   * Toggle expanded log details
   */
  toggleLogExpansion(log: LogEntry, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Reset active tab when expanding a log
    if (!log.expanded) {
      this.activeTab = 'data';
    }
    
    // Fixed redundant Boolean cast
    log.expanded = !log.expanded;
  }
  
  /**
   * Expand a category to show all logs within it
   */
  expandCategory(log: LogEntry): void {
    if (!log.isCategory || !log.categoryLogs) return;
    
    // Create a temporary view with just this category's logs
    const categoryIndex = this._processedLogs.indexOf(log);
    if (categoryIndex !== -1) {
      // Remove the category
      this._processedLogs.splice(categoryIndex, 1);
      
      // Insert all the category's logs at that position
      this._processedLogs.splice(categoryIndex, 0, ...log.categoryLogs);
      
      // Update the datasource
      this.dataSource.data = [...this._processedLogs];
    }
  }
  
  /**
   * Check if a log has expandable content
   */
  hasExpandableContent(log: LogEntry): boolean {
    // Updated to check for presence of data, rawData, or duplicates
    return !!(log.data || log.rawData || (log.duplicates && log.duplicates.length > 0));
  }
  
  /**
   * Get CSS class based on log level
   */
  getLevelClass(level: LogLevelEnum | string): string {
    // Handle level as string or enum
    const levelStr = typeof level === 'string' ? level.toLowerCase() : logLevelToString(level);
    
    switch (levelStr) {
      case 'trace':
        return 'level-trace';
      case 'debug':
        return 'level-debug';
      case 'info':
        return 'level-info';
      case 'warn':
      case 'warning':
        return 'level-warn';
      case 'error':
        return 'level-error';
      case 'fatal':
        return 'level-fatal';
      default:
        return '';
    }
  }
  
  /**
   * Determine if the log is from backend
   * Logs from the API or server services are considered backend logs
   */
  isBackendLog(log: LogEntry): boolean {
    // Backend logs typically have these sources or context patterns
    const backendSources = [
      'nest', 'nestjs', 'api', 'server', 'backend', 'mongodb', 
      'database', 'forgeboard-api', 'app', 'socket', 'external',
      'bootstrap', 'appmodule', 'configservice', 'externalservice',
      'systemloader', 'healthmonitor', 'loggerservice',
      'authservice', 'userservice', 'diagnosticsservice'
    ];
    
    // Convert to lowercase for case-insensitive comparison
    const source = log.source?.toLowerCase() || '';
    // Use data['context'] instead of direct context property access
    const contextValue = log.data?.['context'] as string || '';
    
    // Check if source or context matches backend patterns
    return backendSources.some(src => 
      source.includes(src.toLowerCase()) || contextValue.includes(src.toLowerCase())
    );
  }
  
  /**
   * Format log details for display
   */
  formatDetails(details: Record<string, unknown> | unknown): string {
    if (!details) return '';
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return String(details);
    }
  }
  
  /**
   * Update available services for filtering
   */
  updateAvailableServices(): void {
    const services = new Set<string>();
    this._logs.forEach(log => {
      if (log.source) {
        services.add(log.source);
      }
    });
    this.availableServices = Array.from(services).sort();
  }
  
  /**
   * Filter logs by selected service
   */
  filterByService(): void {
    this.processLogs();
  }
  
  /**
   * Analyze log purpose
   * This provides more information about what the log is about
   */
  analyzeLogPurpose(log: LogEntry): string {
    // Check for specific patterns in the log to determine its purpose
    
    // Check source and context first
    if (log.source?.includes('TypeDiagnosticsService')) {
      return 'Type validation system registration or validation';
    }
    
    if (log.source?.includes('ConfigService')) {
      return 'Application configuration';
    }
    
    if (log.source?.includes('AuthService') || log.message?.toLowerCase().includes('auth')) {
      return 'Authentication and authorization';
    }
    
    // Check message content
    if (log.message?.toLowerCase().includes('initialize') || 
        log.message?.toLowerCase().includes('started')) {
      return 'Service initialization';
    }
    
    if (log.message?.toLowerCase().includes('connect') || 
        log.message?.toLowerCase().includes('socket')) {
      return 'Network connection management';
    }
    
    // Check data fields
    if (log.data?.['action'] === 'registerValidator') {
      return 'Type validator registration';
    }
    
    if (log.data?.['error']) {
      return 'Error condition reporting';
    }
    
    // Check log level
    if (log.level === LogLevelEnum.ERROR || log.level === LogLevelEnum.FATAL) {
      // Check if it's a sample error
      if (log.message?.includes('[SAMPLE]')) {
        return 'Example error (not a real issue)';
      }
      return 'Error or exception';
    }
    
    if (log.level === LogLevelEnum.WARN) {
      return 'Warning or potential issue';
    }
    
    if (log.level === LogLevelEnum.DEBUG) {
      return 'Debugging information';
    }
    
    if (log.level === LogLevelEnum.TRACE) {
      return 'Detailed trace information';
    }
    
    return 'General log information';
  }

  /**
   * Predicate function for the expandedDetail row
   * Used by the MatTable to determine which rows get the expandedDetail template
   */
  isExpanded(log: LogEntry): boolean {
    return log.expanded === true;
  }
}

/**
 * Helper function to convert LogLevelEnum to string
 */
function logLevelToString(level: LogLevelEnum): string {
  switch (level) {
    case LogLevelEnum.TRACE:
      return 'trace';
    case LogLevelEnum.DEBUG:
      return 'debug';
    case LogLevelEnum.INFO:
      return 'info';
    case LogLevelEnum.WARN:
      return 'warn';
    case LogLevelEnum.ERROR:
      return 'error';
    case LogLevelEnum.FATAL:
      return 'fatal';
    default:
      return 'unknown';
  }
}
