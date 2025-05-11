import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import type { LogEntry } from '@forge-board/shared/api-interfaces'; // Changed to import type

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  async createLog(@Body() logEntry: LogEntry) {
    return this.logsService.saveLog(logEntry);
  }

  @Get()
  async getLogs(@Query() query) {
    return this.logsService.getLogs(query);
  }
}
