import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LogFilter, LogLevelEnum } from '@forge-board/shared/api-interfaces';

interface SourceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-log-filter',
  templateUrl: './log-filter.component.html',
  styleUrls: ['./log-filter.component.scss'],
  standalone: false
})
export class LogFilterComponent {
  @Input() filter: LogFilter = { level: LogLevelEnum.DEBUG };

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
  @Output() filterChange = new EventEmitter<LogFilter>();
  
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
        this.updateFilter({ service: values.join(',') });
      } else if (values && values.length === 0) { 
        // No services selected
        
        // No services selected
        this._service = '';
        this.serviceChange.emit('');
        this.updateFilter({ service: '' });
        console.log('No services selected');
      } else {
        // Multiple services selected, use filters
        this.updateFilter({ service: values ? values.join(',') : '' });
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
  
  updateFilter(partialFilter: Partial<LogFilter>): void {
    const updatedFilter: LogFilter = {
      ...this.filter,
      ...partialFilter
    };
    
    this.filterChange.emit(updatedFilter);
  }
}
