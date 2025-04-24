import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LogLevelOption {
  level: string;
  color: string;
  selected: boolean;
}

@Component({
  selector: 'app-log-level-selector',
  templateUrl: './log-level-selector.component.html',
  styleUrls: ['./log-level-selector.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LogLevelSelectorComponent implements OnInit {
  @Input() selectedLevels: string[] = [];
  @Output() levelsChanged = new EventEmitter<string[]>();

  levelOptions: LogLevelOption[] = [
    { level: 'debug', color: '#9e9e9e', selected: false },
    { level: 'info', color: '#2196f3', selected: false },
    { level: 'warn', color: '#ff9800', selected: false },
    { level: 'error', color: '#f44336', selected: false },
    { level: 'fatal', color: '#9c27b0', selected: false }
  ];

  ngOnInit(): void {
    // Initialize with selected levels
    this.syncSelectedLevels();
  }

  toggleLevel(level: LogLevelOption): void {
    level.selected = !level.selected;
    this.emitSelectedLevels();
  }

  private syncSelectedLevels(): void {
    this.levelOptions.forEach(option => {
      option.selected = this.selectedLevels.includes(option.level);
    });
  }

  private emitSelectedLevels(): void {
    const selected = this.levelOptions
      .filter(option => option.selected)
      .map(option => option.level);
    this.levelsChanged.emit(selected);
  }
}
