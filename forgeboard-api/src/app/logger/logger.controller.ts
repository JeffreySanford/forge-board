import { Controller, Get } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { LogEntry } from '@forge-board/shared/api-interfaces';
import { LoggerService } from './logger.service';

@Controller('logger')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get('logs')
  getLogs(): Observable<LogEntry[]> {
    // Return logs from the logger service
    return of(this.loggerService.getLogs());
  }
}
