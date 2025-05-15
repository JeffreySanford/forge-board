import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-log-search',
  template: `
    <div class="search-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search logs</mat-label>
        <input 
          matInput 
          [(ngModel)]="searchTerm" 
          (keyup.enter)="onSearch()"
          placeholder="Enter search terms">
        <button 
          *ngIf="searchTerm" 
          matSuffix 
          mat-icon-button 
          aria-label="Clear" 
          (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="onSearch()">
        <mat-icon>search</mat-icon>
        Search
      </button>
    </div>
  `,
  styles: [`
    .search-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .search-field {
      flex: 1;
    }
  `],
  standalone: false
})
export class LogSearchComponent {
  @Output() searchChanged = new EventEmitter<string>();
  
  searchTerm: string = '';
  
  onSearch(): void {
    this.searchChanged.emit(this.searchTerm);
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.searchChanged.emit('');
  }
}
