import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LoggerService } from '../../services/logger.service';
import { LogEntry, LogLevel, LogFilter } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  standalone: false
})
export class LogViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  // Table data
  dataSource = new MatTableDataSource<LogEntry>([]);
  displayedColumns: string[] = ['level', 'timestamp', 'source', 'message', 'actions'];
  selection = new SelectionModel<LogEntry>(true, []);
  
  // Filtering
  filterForm: FormGroup;
  logLevels = Object.values(LogLevel);
  sources: string[] = [];
  contexts: string[] = [];
  totalLogs = 0;
  
  // Selected log for detail view
  selectedLog: LogEntry | null = null;
  
  // Loading state
  loading = true;
  
  // Track live updates
  liveUpdates = true;
  
  // View child components
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  // Subscriptions for cleanup
  private subscriptions = new Subscription();
  
  constructor(
    private loggerService: LoggerService,
    private fb: FormBuilder
  ) {
    // Initialize filter form
    this.filterForm = this.fb.group({
      levels: [[]],
      sources: [[]],
      contexts: [[]],
      search: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    // Subscribe to log stream for live updates
    this.subscriptions.add(
      this.loggerService.getLogStream().subscribe(log => {
        if (this.liveUpdates) {
          // Only add to table if it passes the current filter
          if (this.passesFilter(log)) {
            this.dataSource.data = [log, ...this.dataSource.data];
            this.totalLogs++;
          }
          
          // Update sources and contexts lists
          if (!this.sources.includes(log.source)) {
            this.sources = [...this.sources, log.source].sort();
          }
          
          if (log.context && !this.contexts.includes(log.context)) {
            this.contexts = [...this.contexts, log.context].sort();
          }
        }
      })
    );
    
    // Subscribe to filter changes
    this.subscriptions.add(
      this.filterForm.valueChanges
        .pipe(debounceTime(300))
        .subscribe(() => {
          this.applyFilter();
        })
    );
    
    // Load initial logs
    this.loadLogs();
  }
  
  ngAfterViewInit(): void {
    // Set up paginator and sort
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom filter predicate for complex filtering
    this.dataSource.filterPredicate = (data: LogEntry, filter: string) => {
      return this.passesFilter(data);
    };
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Load logs with current filter
   */
  loadLogs(): void {
    this.loading = true;
    const filter: LogFilter = {
      ...this.filterForm.value,
      limit: 100
    };
    
    this.subscriptions.add(
      this.loggerService.queryLogs(filter).subscribe({
        next: (response) => {
          this.dataSource.data = response.logs;
          this.totalLogs = response.total;
          this.loading = false;
          
          // Extract unique sources and contexts
          const uniqueSources = new Set<string>();
          const uniqueContexts = new Set<string>();
          
          response.logs.forEach(log => {
            uniqueSources.add(log.source);
            if (log.context) {
              uniqueContexts.add(log.context);
            }
          });
          
          this.sources = Array.from(uniqueSources).sort();
          this.contexts = Array.from(uniqueContexts).sort();
        },
        error: (err) => {
          console.error('Error loading logs:', err);
          this.loading = false;
        }
      })
    );
  }
  
  /**
   * Apply current filter
   */
  applyFilter(): void {
    // If we're doing client-side filtering
    this.dataSource.filter = JSON.stringify(this.filterForm.value);
    
    // Reset paginator to first page
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    
    // For server-side filtering, reload logs
    this.loadLogs();
  }
  
  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.patchValue({
      levels: [],
      sources: [],
      contexts: [],
      search: '',
      startDate: null,
      endDate: null
    });
    
    this.applyFilter();
  }
  
  /**
   * Toggle live updates
   */
  toggleLiveUpdates(): void {
    this.liveUpdates = !this.liveUpdates;
    
    if (this.liveUpdates) {
      // Update socket subscription with current filter
      const filter: LogFilter = {
        ...this.filterForm.value,
        limit: 100
      };
      
      this.loggerService.updateFilter(filter);
    }
  }
  
  /**
   * Open log detail view
   */
  viewLogDetail(log: LogEntry): void {
    this.selectedLog = log;
  }
  
  /**
   * Close detail view
   */
  closeDetail(): void {
    this.selectedLog = null;
  }
  
  /**
   * Get the CSS class for a log level
   */
  getLevelClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'level-debug';
      case LogLevel.INFO:
        return 'level-info';
      case LogLevel.WARNING:
        return 'level-warning';
      case LogLevel.ERROR:
        return 'level-error';
      case LogLevel.CRITICAL:
        return 'level-critical';
      default:
        return '';
    }
  }
  
  /**
   * Get level icon
   */
  getLevelIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'bug_report';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARNING:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.CRITICAL:
        return 'dangerous';
      default:
        return 'help';
    }
  }
  
  /**
   * Check if a log passes the current filter
   */
  private passesFilter(log: LogEntry): boolean {
    const filterValue = this.filterForm.value;
    
    // Check levels filter
    if (filterValue.levels?.length > 0 && !filterValue.levels.includes(log.level)) {
      return false;
    }
    
    // Check sources filter
    if (filterValue.sources?.length > 0 && !filterValue.sources.includes(log.source)) {
      return false;
    }
    
    // Check contexts filter
    if (filterValue.contexts?.length > 0 && 
        (!log.context || !filterValue.contexts.includes(log.context))) {
      return false;
    }
    
    // Check search filter
    if (filterValue.search) {
      const search = filterValue.search.toLowerCase();
      const messageMatch = log.message.toLowerCase().includes(search);
      const sourceMatch = log.source.toLowerCase().includes(search);
      const contextMatch = log.context && log.context.toLowerCase().includes(search);
      
      if (!messageMatch && !sourceMatch && !contextMatch) {
        return false;
      }
    }
    
    // Check date range
    if (filterValue.startDate) {
      const startDate = new Date(filterValue.startDate).getTime();
      if (new Date(log.timestamp).getTime() < startDate) {
        return false;
      }
    }
    
    if (filterValue.endDate) {
      const endDate = new Date(filterValue.endDate).getTime();
      if (new Date(log.timestamp).getTime() > endDate) {
        return false;
      }
    }
    
    return true;
  }
}
