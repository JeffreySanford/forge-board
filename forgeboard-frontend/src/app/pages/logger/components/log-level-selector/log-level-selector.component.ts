import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LogLevelEnum } from '@forge-board/shared/api-interfaces';

interface LevelOption {
  level: LogLevelEnum;
  selected: boolean;
  color: string; // Added color property
}

@Component({
  selector: 'app-log-level-selector',
  templateUrl: './log-level-selector.component.html',
  styleUrls: ['./log-level-selector.component.scss'],
  standalone: false
})
export class LogLevelSelectorComponent implements OnInit {
  @Input() selectedLevels: LogLevelEnum[] = [];
  @Output() levelsChanged = new EventEmitter<LogLevelEnum[]>();

  // Updated levels to include a color property
  levels: LevelOption[] = [
    { level: LogLevelEnum.DEBUG, selected: false, color: '#007bff' }, // Example color
    { level: LogLevelEnum.INFO, selected: false, color: '#28a745' },  // Example color
    { level: LogLevelEnum.WARN, selected: false, color: '#ffc107' },  // Example color
    { level: LogLevelEnum.ERROR, selected: false, color: '#dc3545' }, // Example color
    { level: LogLevelEnum.FATAL, selected: false, color: '#343a40' }  // Example color
  ];

  ngOnInit(): void {
    // Initialize with selected levels
    this.syncSelectedLevels();
  }

  selectAll(): void {
    this.levels.forEach(l => (l.selected = true));
    this.updateSelected();
  }

  selectNone(): void {
    this.levels.forEach(l => (l.selected = false));
    this.updateSelected();
  }

  toggleLevel(level: LevelOption): void {
    level.selected = !level.selected;
    this.updateSelected();
  }

  private syncSelectedLevels(): void {
    this.levels.forEach(option => {
      option.selected = this.selectedLevels.includes(option.level);
    });
  }

  private updateSelected(): void {
    this.selectedLevels = this.levels
      .filter(l => l.selected)
      .map(l => l.level);
    this.levelsChanged.emit(this.selectedLevels);
  }

  // Helper to convert enum to string
  getLevelString(level: LogLevelEnum): string {
    return LogLevelEnum[level];
  }
}
