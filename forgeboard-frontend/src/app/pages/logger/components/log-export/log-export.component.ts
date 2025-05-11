import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LogEntry } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-log-export',
  templateUrl: './log-export.component.html',
  styleUrls: ['./log-export.component.scss'],
  standalone: false
})
export class LogExportComponent {
  @Input() logs: LogEntry[] = []; // Add the missing logs input property
  @Output() exportJson = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();
  
  onExportJson(): void {
    this.exportJson.emit();
  }
  
  onExportCsv(): void {
    this.exportCsv.emit();
  }
}
