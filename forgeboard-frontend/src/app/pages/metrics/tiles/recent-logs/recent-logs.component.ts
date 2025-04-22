import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { take } from 'rxjs/operators';

// Define interfaces for type safety
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source?: string;
}

@Component({
  selector: 'app-recent-logs',
  templateUrl: './recent-logs.component.html',
  styleUrls: ['./recent-logs.component.scss'],
  standalone: false
})
export class RecentLogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  private subscriptions = new Subscription();
  
  constructor() {
    // Initialize logs array and loading state
    this.logs = [];
    this.isLoading = true;
    this.errorMessage = null;
  } 
  
  ngOnInit(): void {
    // Simulate API call to fetch logs
    const logFetch$ = timer(1000)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.logs = this.getMockLogs();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching logs:', err);
          this.errorMessage = 'Failed to load logs. Please try again later.';
          this.isLoading = false;
        }
      });
    
    this.subscriptions.add(logFetch$);
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }
  
  // Mock data generator until real API is connected
  private getMockLogs(): LogEntry[] {
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Application started successfully',
        source: 'system'
      },
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected',
        source: 'monitoring'
      }
    ];
  }
  
  // Helper method for log level styling
  getLogLevelClass(level: string): string {
    switch(level) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      default: return 'log-info';
    }
  }
}
