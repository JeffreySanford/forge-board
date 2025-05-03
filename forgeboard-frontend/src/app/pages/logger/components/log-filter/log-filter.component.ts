import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  @Input() service = '';
  @Output() serviceChange = new EventEmitter<string>();
  
  // Add FormControl for sources
  sourcesControl = new FormControl<string[]>([]);
  
  availableSources = [
    { value: '', label: 'All Sources' },
    { value: 'app', label: 'Application' },
    { value: 'api', label: 'API' },
    { value: 'auth', label: 'Authentication' },
    { value: 'db', label: 'Database' }
  ];
  
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
}
