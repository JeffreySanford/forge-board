import { Controller, Post, Body, Logger } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogEntry } from '@forge-board/shared/api-interfaces';

@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name);
  private readonly verboseLogging = false; // Set to false to disable verbose console logs

  constructor(private readonly logsService: LogsService) {}

  @Post()
  async addLogs(@Body() logs: LogEntry[]) {
    // Keep adding logs to the service
    const result = await this.logsService.addLogs(logs);
    
    // Only log to console if verbose logging is enabled
    if (this.verboseLogging) {
      this.logger.log(`Received ${logs.length} log entries`);
    }
    
    return result;
  }
}
