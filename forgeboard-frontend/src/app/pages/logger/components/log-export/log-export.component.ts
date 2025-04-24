import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-log-export',
  templateUrl: './log-export.component.html',
  styleUrls: ['./log-export.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ]
})
export class LogExportComponent {
  @Output() exportJson = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();
  
  onExportJson(): void {
    this.exportJson.emit();
  }
  
  onExportCsv(): void {
    this.exportCsv.emit();
  }
}
