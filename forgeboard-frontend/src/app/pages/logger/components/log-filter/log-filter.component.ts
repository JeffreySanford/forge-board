import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-log-filter',
  templateUrl: './log-filter.component.html',
  styleUrls: ['./log-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class LogFilterComponent implements OnInit {
  @Input() availableSources: string[] = [];
  @Input() selectedSources: string[] = [];
  @Output() sourcesChanged = new EventEmitter<string[]>();

  sourcesControl = new FormControl<string[]>([]);

  ngOnInit(): void {
    // Make sure sources control has an empty array as default
    if (!this.sourcesControl.value) {
      this.sourcesControl.setValue([]);
    }
  }

  ngOnChanges(): void {
    this.sourcesControl.setValue(this.selectedSources);
  }

  onSourcesChange(): void {
    this.sourcesChanged.emit(this.sourcesControl.value || []);
  }

  clearSources(): void {
    this.sourcesControl.setValue([]);
    this.sourcesChanged.emit([]);
  }

  selectAllSources(): void {
    this.sourcesControl.setValue([...this.availableSources]);
    this.sourcesChanged.emit(this.availableSources);
  }
}
