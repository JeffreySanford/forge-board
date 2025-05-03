import { Injectable, Logger } from '@nestjs/common';
import { LogEntry } from '@forge-board/shared/api-interfaces';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private logs: LogEntry[] = [];

  async addLogs(logs: LogEntry[]): Promise<{ success: boolean }> {
    if (!logs || logs.length === 0) {
      return { success: false };
    }

    try {
      // Store logs in memory (in a real app, this would persist to a database)
      this.logs.push(...logs);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error adding logs: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  getLogs(): LogEntry[] {
    // Basic implementation - would implement filtering in a real app
    return this.logs;
  }
}
