import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { LogEntry } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-log-entry',
  template: `
    <div class="log-entry" [ngClass]="getLevelClass(log.level)">
      <div class="log-meta">
        <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
        <span class="log-level">{{ log.level | uppercase }}</span>
        <span class="log-source" [ngClass]="{'testing-source': isTestSource()}">{{ log.source }}</span>
      </div>
      <div class="log-message" [innerHTML]="highlightTestingText(log.message)"></div>
      <div class="log-details" *ngIf="log.data">
        <pre>{{ log.data | json }}</pre>
      </div>
    </div>
  `,
  styleUrls: ['./log-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LogEntryComponent {
  @Input() log!: LogEntry;

  getLevelClass(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return 'log-error';
      case 'warn':
      case 'warning': return 'log-warning';
      case 'info': return 'log-info';
      case 'debug': return 'log-debug';
      default: return '';
    }
  }
  
  isTestSource(): boolean {
    return this.log.source === 'testing' || this.log.source === 'test-generator';
  }
  
  highlightTestingText(text: string): string {
    if (!text) return '';
    return text.replace(/TESTING:?/g, '<span class="testing-highlight">TESTING:</span>');
  }
}
