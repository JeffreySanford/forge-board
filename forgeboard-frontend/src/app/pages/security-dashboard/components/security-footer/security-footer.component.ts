import { Component, Input, OnChanges } from '@angular/core';
import { UserTile } from '../../models/user-tile.model';

@Component({
  selector: 'app-security-footer',
  templateUrl: './security-footer.component.html',
  styleUrls: ['./security-footer.component.scss'],
  standalone: false,
})
export class SecurityFooterComponent implements OnChanges {
  @Input() tiles: UserTile[] = [];

  // Remove 'row, col' from displayedColumns to match template columns
  displayedColumns: string[] = [
    'id',
    'title',
    'category',
    'status',
    'lastUpdated',
    'position',
  ];
  dataSource: UserTile[] = [];

  ngOnChanges(): void {
    if (this.tiles) {
      this.dataSource = this.tiles.sort((a, b) => a.position - b.position);
    }
  }

  getStatusClass(status: string): string {
    return status;
  }
}
