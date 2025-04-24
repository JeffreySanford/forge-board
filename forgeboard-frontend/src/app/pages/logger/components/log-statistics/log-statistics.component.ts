import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogLevel } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-log-statistics',
  templateUrl: './log-statistics.component.html',
  styleUrls: ['./log-statistics.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LogStatisticsComponent {
  @Input() stats: Record<string, number> = {
    debug: 0,
    info: 0,
    warning: 0,
    warn: 0,
    error: 0,
    fatal: 0
  };
  
  @Input() totalLogs = 0;

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
}
