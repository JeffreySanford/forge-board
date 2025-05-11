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
    switch (this.storageType) {
      case 'memory':
        return 'Data stored in application memory (RAM). Cleared on refresh.';
      case 'localStorage':
        return 'Data stored in browser local storage. Persists across sessions.';
      case 'mongodb':
        return 'Data stored in a MongoDB database. Persistent and scalable.';
      case 'blockchain':
        return 'Data recorded on a blockchain. Immutable and decentralized.';
      default:
        return 'Unknown storage type';
    }
  }

  getStorageDescription(): string {
    // More detailed descriptions for the hover effect
    switch (this.storageType) {
      case 'memory':
        return 'Volatile storage, ideal for temporary session data. Fast access but data is lost when the application or browser tab is closed.';
      case 'localStorage':
        return 'Browser-based storage that allows web applications to store data persistently on a user\'s computer. Limited in size (usually 5-10MB).';
      case 'mongodb':
        return 'A NoSQL document database, offering high performance, high availability, and automatic scaling. Suitable for large and complex datasets.';
      case 'blockchain':
        return 'A distributed ledger technology that provides a secure and transparent way to record transactions or data. Ensures data integrity and immutability.';
      default:
        return 'No description available for this storage type.';
    }
  }
}
