import { Controller, Post, Body, Logger } from '@nestjs/common';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  [key: string]: any;
}

@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name);

  @Post('batch')
  async batch(@Body() logs: LogEntry[]): Promise<{ success: boolean }> {
    if (!Array.isArray(logs)) {
      this.logger.warn('Received non-array logs batch');
      return { success: false };
    }
    this.logger.log(`Received ${logs.length} log entries`);
    // Optionally process/store logs here
    return { success: true };
  }
}
