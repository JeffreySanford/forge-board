import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LogLevelEnum, ExtendedLogFilter } from '@forge-board/shared/api-interfaces';

interface SourceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-log-filter',
  templateUrl: './log-filter.component.html',
  styleUrls: ['./log-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class LogFilterComponent {
  @Input() filter: ExtendedLogFilter = { level: LogLevelEnum.DEBUG };
  
  @Input() set service(value: string) {
    this._service = value || '';
    this.sourcesControl.setValue([value]);
  }
  
  get service(): string {
    return this._service;
  }
  
  @Input() set availableSources(sources: string[]) {
    this._availableSources = [
      { value: '', label: 'All Sources' },
      ...sources.map(s => ({ value: s, label: s }))
    ];
  }
  
  get availableSources(): SourceOption[] {
    return this._availableSources;
  }
  
  @Output() serviceChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<ExtendedLogFilter>();
  
  sourcesControl = new FormControl<string[]>([]);
  
  private _service = '';
  private _availableSources: SourceOption[] = [
    { value: '', label: 'All Sources' }
  ];
  
  constructor() {
    this.sourcesControl.valueChanges.subscribe(values => {
      if (values && values.length === 1) {
        this._service = values[0];
        this.serviceChange.emit(this._service);
      } else if (values && values.length > 1) {
        // Multiple services selected, use filters
        this.updateFilter({ service: undefined, sources: values });
      } else {
        // No services selected
        this._service = '';
        this.serviceChange.emit('');
      }
    });
  }
  
  onSourceChange(service: string): void {
    this.serviceChange.emit(service);
  }
  
  selectAllSources(): void {
    const allValues = this.availableSources
      .map(source => source.value)
      .filter(value => value !== '');
    this.sourcesControl.setValue(allValues);
  }
  
  clearSources(): void {
    this.sourcesControl.setValue([]);
    this.service = '';
    this.serviceChange.emit('');
  }
  
  updateFilter(partialFilter: Partial<ExtendedLogFilter>): void {
    const updatedFilter: ExtendedLogFilter = {
      ...this.filter,
      ...partialFilter
    };
    
    this.filterChange.emit(updatedFilter);
  }
}
