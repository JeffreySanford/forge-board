import { Component, OnInit } from '@angular/core';
import { LoggerService } from '../../services/logger.service';
import { Observable } from 'rxjs';
import { LogEntry } from '@forge-board/shared/api-interfaces';
import { LoggerTileComponent } from '../../components/logger/logger-tile.component';

@Component({
  selector: 'app-logger-view',
  templateUrl: './logger-view.component.html',
  styleUrls: ['./logger-view.component.scss'],
  // Alternatively, if not a standalone component, remove the imports property
  standalone: false
})
export class LoggerViewComponent implements OnInit {
  logs$: Observable<LogEntry[]>;
  
  constructor(private loggerService: LoggerService) {
    this.logs$ = this.loggerService.getLogs();
  }

  ngOnInit(): void {
    // Fetch initial logs
    this.loggerService.fetchLogs();
  }
}
