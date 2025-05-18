// Shared LoggerService for both frontend and backend (framework-agnostic)
// This class is not decorated with Angular or NestJS decorators.
// It can be extended or composed in framework-specific services.
import { BehaviorSubject, Observable } from 'rxjs';
import { LogEntry, LogLevelEnum, LogFilter } from '@forge-board/shared/api-interfaces';

export class SharedLoggerService {
  protected logsSubject = new BehaviorSubject<LogEntry[]>([]);
  protected logStatsSubject = new BehaviorSubject<Record<LogLevelEnum, number>>({
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 0,
    [LogLevelEnum.WARN]: 0,
    [LogLevelEnum.ERROR]: 0,
    [LogLevelEnum.FATAL]: 0,
    [LogLevelEnum.TRACE]: 0
  });

  getLogs(): Observable<LogEntry[]> {
    return this.logsSubject.asObservable();
  }

  getLogStats(): Observable<Record<LogLevelEnum, number>> {
    return this.logStatsSubject.asObservable();
  }

  addLog(entry: LogEntry): void {
    const logs = [entry, ...this.logsSubject.getValue()];
    this.logsSubject.next(logs);
    const stats = { ...this.logStatsSubject.getValue() };
    stats[entry.level] = (stats[entry.level] || 0) + 1;
    this.logStatsSubject.next(stats);
  }

  filterLogs(filter: LogFilter): LogEntry[] {
    return this.logsSubject.getValue().filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.service && log.source !== filter.service) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logsSubject.next([]);
    this.logStatsSubject.next({
      [LogLevelEnum.DEBUG]: 0,
      [LogLevelEnum.INFO]: 0,
      [LogLevelEnum.WARN]: 0,
      [LogLevelEnum.ERROR]: 0,
      [LogLevelEnum.FATAL]: 0,
      [LogLevelEnum.TRACE]: 0
    });
  }
}
