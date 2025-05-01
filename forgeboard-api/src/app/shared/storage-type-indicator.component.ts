import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-storage-type-indicator',
  template: `
    <div class="storage-indicator" [ngClass]="storageType">
      <div class="indicator-icon" [matTooltip]="getTooltipText()">
        <!-- Icon based on storage type -->
        <mat-icon *ngIf="storageType === 'memory'">memory</mat-icon>
        <mat-icon *ngIf="storageType === 'localStorage'">storage</mat-icon>
        <mat-icon *ngIf="storageType === 'mongodb'">database</mat-icon>
        <mat-icon *ngIf="storageType === 'blockchain'">link</mat-icon>
      </div>
      <div class="indicator-pulse"></div>
      
      <!-- Animated details on hover -->
      <div class="storage-details">
        <h4>Storage: {{ storageType | titlecase }}</h4>
        <p>{{ getStorageDescription() }}</p>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
  ],
  styles: [`
    .storage-indicator {
      display: flex;
      align-items: center;
      position: relative;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .indicator-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .indicator-pulse {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .memory {
      background: rgba(0, 191, 255, 0.1);
      border: 1px solid deepskyblue;
    }
    
    .memory .indicator-pulse {
      background-color: deepskyblue;
    }
    
    .localStorage {
      background: rgba(144, 238, 144, 0.1);
      border: 1px solid lightgreen;
    }
    
    .localStorage .indicator-pulse {
      background-color: lightgreen;
    }
    
    .mongodb {
      background: rgba(75, 181, 67, 0.1);
      border: 1px solid #4BB543;
    }
    
    .mongodb .indicator-pulse {
      background-color: #4BB543;
    }
    
    .blockchain {
      background: rgba(255, 140, 0, 0.1);
      border: 1px solid darkorange;
    }
    
    .blockchain .indicator-pulse {
      background-color: darkorange;
    }
    
    .storage-details {
      position: absolute;
      top: 100%;
      right: 0;
      width: 250px;
      background-color: #2a2a2a;
      border-radius: 4px;
      padding: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      pointer-events: none;
      z-index: 10;
    }
    
    .storage-indicator:hover .storage-details {
      opacity: 1;
      transform: translateY(5px);
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 191, 255, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(0, 191, 255, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(0, 191, 255, 0);
      }
    }
  `]
})
export class StorageTypeIndicatorComponent implements OnInit {
  @Input() storageType: 'memory' | 'localStorage' | 'mongodb' | 'blockchain' = 'memory';
  
  constructor() { }
  
  ngOnInit(): void { }
  
  getTooltipText(): string {
    return `Data stored in ${this.storageType}`;
  }
  
  getStorageDescription(): string {
    switch (this.storageType) {
      case 'memory':
        return 'Data is stored in server memory and will be lost when the server restarts.';
      case 'localStorage':
        return 'Data is persisted in the browser\'s localStorage.';
      case 'mongodb':
        return 'Data is stored in MongoDB database for persistence.';
      case 'blockchain':
        return 'Data is stored on a blockchain ledger for immutability.';
      default:
        return 'Unknown storage type';
    }
  }
}
