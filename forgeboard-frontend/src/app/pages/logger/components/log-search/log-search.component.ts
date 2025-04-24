import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-log-search',
  templateUrl: './log-search.component.html',
  styleUrls: ['./log-search.component.scss']
})
export class LogSearchComponent {
  @Output() searchChanged = new EventEmitter<string>();
  
  searchControl = new FormControl('');
  
  constructor() {
    // Debounce search input to reduce API calls
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.searchChanged.emit(value || '');
      });
  }
  
  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
