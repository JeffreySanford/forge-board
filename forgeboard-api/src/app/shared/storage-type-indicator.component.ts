import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-storage-type-indicator',
  templateUrl: './storage-type-indicator.component.html',
  styleUrls: ['./storage-type-indicator.component.scss'],
  standalone: false, // Ensure no standalone component
})
export class StorageTypeIndicatorComponent {
  @Input() storageType: 'memory' | 'localStorage' | 'mongodb' | 'blockchain' = 'memory';
  
  getTooltipText(): string {
    return `Data stored in ${this.storageType}`;
  }
  
  getStorageDescription(): string {
    switch (this.storageType) {
      case 'memory':
        return 'Data is stored in server memory and will be lost when the server restarts.';
      case 'localStorage':
        return "Data is persisted in the browser's localStorage.";
      case 'mongodb':
        return 'Data is stored in MongoDB database for persistence.';
      case 'blockchain':
        return 'Data is stored on a blockchain ledger for immutability.';
      default:
        return 'Unknown storage type';
    }
  }
}
