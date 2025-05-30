import { Component, Inject, OnInit } from '@angular/core';
import { UserTile } from './models/user-tile.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger.service';


@Component({
  selector: 'app-security-dashboard',
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.scss'],
  standalone: false
})
export class SecurityDashboardComponent implements OnInit {
  navLinks = [
    { path: 'vulnerabilities', label: 'Vulnerability Management' },
    { path: 'compliance', label: 'Compliance' },
    { path: 'threat-intel', label: 'Threat Intelligence' },
    { path: 'access-control', label: 'Access Control' }
  ];

  allTiles$ = new BehaviorSubject<UserTile[]>([]);
  
  constructor(
    @Inject(Router) private router: Router,
    @Inject(LoggerService) private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.logger.info('[Logger] Security Dashboard initialized');
    // setup an event to tract the current url and update the logger so the subchildren dont ahve to do it
    this.router.events.subscribe(() => {
      this.logCurrentUrl();
    });
  }

  logCurrentUrl(): Observable<string> {
    const currentUrl = this.router.url;
    this.logger.info(`[Logger] Current URL: ${currentUrl}`);

    return new Observable<string>(observer => {
      observer.next(currentUrl);
      observer.complete();
    });
  }

  updateTileState(tiles: UserTile[], category: string): void {
    // Update the tiles for the specific category
    const currentTiles = this.allTiles$.value;
    const filteredTiles = currentTiles.filter(tile => tile.category !== category);
    this.allTiles$.next([...filteredTiles, ...tiles]);
  }
}
