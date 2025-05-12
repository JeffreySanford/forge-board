import { Controller, Post, Body, Get, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { LogsService } from './logs.service';
import type { LogEntry } from '@forge-board/shared/api-interfaces'; // Changed to import type
import { ApiResponse } from '@forge-board/shared/api-interfaces'; // Import ApiResponse
import { LoggerService } from '../logger/logger.service'; // Import LoggerService
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Controller('logs')
export class LogsController {
  private readonly controllerLogger = new Logger(LogsController.name); // Renamed logger instance

  constructor(
    private readonly logsService: LogsService,
    private readonly loggerService: LoggerService // Inject LoggerService
  ) {}

  @Post()
  async createLog(@Body() logEntry: LogEntry) {
    // For single log entries, we can still use the original LogsService's saveLog,
    // or delegate to loggerService.addLogs([logEntry]) if we want all logging through LoggerService.
    // Sticking to original behavior for this endpoint for now.
    return this.logsService.saveLog(logEntry);
  }

  @Post('batch') // New endpoint for batch log submission
  addLogsBatch(@Body() logs: LogEntry[]): Observable<ApiResponse<{ count: number }>> {
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new HttpException('Log batch must be a non-empty array.', HttpStatus.BAD_REQUEST);
    }
    this.controllerLogger.log(`Received batch of ${logs.length} logs.`);
    return this.loggerService.addLogs(logs).pipe(
      map(processedLogs => {
        const count = processedLogs.length;
        this.controllerLogger.log(`Successfully processed batch of ${count} logs.`);
        return {
          success: true,
          message: `Successfully processed ${count} log(s).`,
          data: { count },
          timestamp: new Date().toISOString(),
          statusCode: HttpStatus.OK
        };
      }),
      catchError(error => {
        this.controllerLogger.error(`Error processing log batch: ${error.message}`, error.stack);
        // Ensure a proper error response is sent to the client
        throw new HttpException(
          { 
            success: false, 
            message: `Failed to process log batch: ${error.message}`, 
            error: error.message,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString()
          } as ApiResponse<never>, 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      })
    );
  }

  @Get()
  async getLogs(@Query() query) {
    return this.logsService.getLogs(query);
  }
}
