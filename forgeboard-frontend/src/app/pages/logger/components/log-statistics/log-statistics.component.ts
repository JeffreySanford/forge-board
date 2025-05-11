import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogStatsResult } from '@forge-board/shared/api-interfaces';
import { LoggerService } from '../../logger.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-log-statistics',
  templateUrl: './log-statistics.component.html',
  styleUrls: ['./log-statistics.component.scss'],
  standalone: false
})
export class LogStatisticsComponent implements OnInit, OnDestroy {
  @Input() stats: Record<string, number> = {
    debug: 0,
    info: 0,
    warning: 0,
    warn: 0,
    error: 0,
    fatal: 0
  };
  
  @Input() totalLogs = 0;
  
  private destroy$ = new Subject<void>();
  
  constructor(private loggerService: LoggerService) {}
  
  ngOnInit(): void {
    // Get initial statistics from the API
    this.loggerService.getStatistics().pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.updateStats(stats);
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private updateStats(stats: LogStatsResult): void {
    this.totalLogs = stats.totalCount;
    
    // Map API's byLevel to our component's stats format
    Object.keys(stats.byLevel).forEach(level => {
      const levelName = this.mapLevelToName(parseInt(level, 10));
      if (levelName) {
        this.stats[levelName] = stats.byLevel[level];
      }
    });
  }
  
  private mapLevelToName(level: number): string {
    switch(level) {
      case 0: return 'trace';
      case 1: return 'debug';
      case 2: return 'info';
      case 3: return 'warning'; // or 'warn'
      case 4: return 'error';
      case 5: return 'fatal';
      default: return '';
    }
  }

  getLevelColorClass(level: string): string {
    switch (level) {
      case 'debug': return 'level-debug';
      case 'info': return 'level-info';
      case 'warn':
      case 'warning': return 'level-warning';
      case 'error': return 'level-error';
      case 'fatal': return 'level-fatal';
      default: return '';
    }
  }
  
  getPercentage(level: string): number {
    if (this.totalLogs === 0) return 0;
    return (this.stats[level] / this.totalLogs) * 100;
  }
  
  getLevelColor(level: string): string {
    switch (level) {
      case 'debug': return '#6c757d';  // Gray
      case 'info': return '#0d6efd';   // Blue
      case 'warn': return '#ffc107';   // Yellow
      case 'warning': return '#ffc107'; // Yellow
      case 'error': return '#dc3545';  // Red
      case 'fatal': return '#6f42c1';  // Purple
      default: return '#6c757d';       // Default gray
    }
  }
}
