import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { LogEntry } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent implements OnInit, AfterViewInit {
  @Input() set logs(value: LogEntry[]) {
    this._logs = value;
    if (this.dataSource) {
      this.dataSource.data = this._logs;
    }
  }
  
  get logs(): LogEntry[] {
    return this._logs;
  }
  
  private _logs: LogEntry[] = [];
  
  displayedColumns: string[] = ['timestamp', 'level', 'source', 'message', 'actions'];
  dataSource = new MatTableDataSource<LogEntry>([]);
  expandedLog: LogEntry | null = null;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  ngOnInit(): void {
    this.dataSource.data = this.logs;
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom sort for timestamp
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'timestamp':
          return new Date(item.timestamp).getTime();
        default:
          return (item as any)[property];
      }
    };
  }
  
  /**
   * Toggle expanded log details
   */
  toggleDetails(log: LogEntry): void {
    this.expandedLog = this.expandedLog === log ? null : log;
  }
  
  /**
   * Get CSS class based on log level
   */
  getLevelClass(level: string): string {
    switch (level) {
      case 'debug':
        return 'level-debug';
      case 'info':
        return 'level-info';
      case 'warn':
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
   * Format log details for display
   */
  formatDetails(details: any): string {
    return JSON.stringify(details, null, 2);
  }
}
