import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LogEntry } from '@forge-board/shared/api-interfaces';
import { LoggerService } from '../../../../services/logger.service';

@Component({
  selector: 'app-recent-logs',
  templateUrl: './recent-logs.component.html',
  styleUrls: ['./recent-logs.component.scss'],
  standalone: false
})
export class RecentLogsComponent implements OnInit {
  logs$!: Observable<LogEntry[]>;
  
  constructor(private loggerService: LoggerService) {}
  
  ngOnInit(): void {
    this.logs$ = this.loggerService.getLogs();
  }
}
