import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogDto, LogEntry } from '@forge-board/shared/api-interfaces';

@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name);
  private readonly verboseLogging = false; // Set to false to disable verbose console logs
  private readonly debugLogging = true; // Set to true to see log content in console

  constructor(private readonly logsService: LogsService) {}

  @Post()
  async addLog(@Body() log: LogEntry) {
    // Keep adding logs to the service
    const result = await this.logsService.addLogs([log]);
    
    // Only log to console if verbose logging is enabled
    if (this.verboseLogging) {
      this.logger.log(`Received log entry: ${log.message}`);
    }
    
    // Debug logging to see actual content
    if (this.debugLogging) {
      console.log('Single log content:', JSON.stringify(log, null, 2));
    }
    
    return result;
  }

  @Post('batch')
  async createBatchLogs(@Body() logDtos: LogDto[]) {
    this.logger.log(`Creating batch of ${logDtos.length} logs`);
    
    // Debug logging to see actual content of the logs
    if (this.debugLogging) {
      console.log('=== BATCH LOGS CONTENT ===');
      console.log(`Received ${logDtos.length} logs at ${new Date().toISOString()}`);
      logDtos.forEach((log, index) => {
        console.log(`Log #${index+1}:`);
        console.log(`- Level: ${log.level}`);
        console.log(`- Source: ${log.source || 'not specified'}`);
        console.log(`- Message: ${log.message}`);
        console.log(`- Timestamp: ${log.timestamp}`);
        if (log.data) {
          console.log(`- Data: ${JSON.stringify(log.data, null, 2)}`);
        }
        console.log('-------------------');
      });
      console.log('=== END BATCH LOGS ===');
    }
    
    try {
      const createdLogs = await this.logsService.createMany(logDtos);
      return { 
        success: true, 
        count: createdLogs.length,
        message: `Successfully saved ${createdLogs.length} logs`
      };
    } catch (error) {
      this.logger.error(`Failed to create batch logs: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to create batch logs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
