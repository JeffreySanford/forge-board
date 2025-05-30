import { Component, Input } from '@angular/core';
import { UserTile } from '../../models/user-tile.model';

@Component({
  selector: 'app-security-tile',
  templateUrl: './security-tile.component.html',
  styleUrls: ['./security-tile.component.scss'],
  standalone: false
})
export class SecurityTileComponent {
  @Input() tile!: UserTile;
  
  get lastUpdatedFormatted(): string {
    return this.tile?.lastUpdated ? 
      new Date(this.tile.lastUpdated).toLocaleString() : 'Unknown';
  }
}
