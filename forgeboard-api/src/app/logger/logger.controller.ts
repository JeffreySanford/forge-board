import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus, Query, Param, Delete } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LogDto, LogEntry, LogFilter, LogLevelEnum, LogQueryResponse } from '@forge-board/shared/api-interfaces';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Controller('logger')
export class LoggerController {
  private readonly logger = new Logger(LoggerController.name);
  private readonly verboseLogging = false; // Set to false to disable verbose console logs
  private readonly debugLogging = false; // Change from true to false to disable debug console output

  constructor(private readonly loggerService: LoggerService) {}

  // Correct getLogs method signature to use proper NestJS parameter decorators
  @Get('logs')
  getLogs(
    @Query('level') level?: LogLevelEnum | LogLevelEnum[],
    @Query('source') source?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit: string = '100',
    @Query('skip') skip: string = '0',
    @Query('afterTimestamp') afterTimestamp?: string,
  ): Observable<LogQueryResponse> {
    const filter: LogFilter = {};
    if (level) filter.level = level;
    if (source) filter.service = source;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (search) filter.search = search;
    if (limit) filter.limit = parseInt(limit, 10);
    if (skip) filter.skip = parseInt(skip, 10);
    if (afterTimestamp) filter.afterTimestamp = afterTimestamp;
    const filtered = Boolean(level || source || startDate || endDate || search || skip || afterTimestamp);
    return this.loggerService.getLogs(filter).pipe(
      map(result => ({
        status: true,
        logs: result,
        totalCount: result.length,
        filtered,
        timestamp: new Date().toISOString()
      }))
    );
  }

  @Post()
  async addLog(@Body() log: LogEntry) {
    // Keep adding logs to the service
    const result = await firstValueFrom(this.loggerService.addLogs([log]));
    
    // Only log to console if verbose logging is enabled
    if (this.verboseLogging) {
      this.logger.log(`Received log entry: ${log.message}`);
    }
    
    // Debug logging to see actual content
    if (this.debugLogging) {
      this.logger.debug('Single log content:', JSON.stringify(log, null, 2));
    }
    
    return result;
  }

  @Post('batch')
  async createBatchLogs(@Body() logDtos: LogDto[]) {
    this.logger.log(`Creating batch of ${logDtos.length} logs`);
    
    // Remove debug logging of content
    // Only log this info if someone is actively debugging and turns verboseLogging on
    if (this.verboseLogging && this.debugLogging) {
      this.logger.debug(`Received ${logDtos.length} logs at ${new Date().toISOString()}`);
      logDtos.forEach((log, index) => {
        this.logger.debug(`Log #${index+1}:`);
        this.logger.debug(`- Level: ${log.level}`);
        this.logger.debug(`- Source: ${log.source || 'not specified'}`);
        this.logger.debug(`- Message: ${log.message}`);
        this.logger.debug(`- Timestamp: ${log.timestamp}`);
        if (log.data) {
          this.logger.debug(`- Data: ${JSON.stringify(log.data, null, 2)}`);
        }
        this.logger.debug('-------------------');
      });
    }
    
    try {
      // Convert LogDto[] to LogEntry[] by adding the required id property
      // Fix logDtos.map to always provide a timestamp
      const logEntries: LogEntry[] = logDtos.map(dto => ({
        ...dto,
        id: '',
        timestamp: dto.timestamp || new Date().toISOString()
      }));
      
      const createdLogs = await firstValueFrom(this.loggerService.createMany(logEntries));
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

  @Get('stats')
  getLogStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('source') source?: string
  ): Observable<LogQueryResponse> {
    const filter: Partial<LogFilter> = {};
    
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (source) filter.service = source;
    
    return this.loggerService.getLogStatistics(filter).pipe(
      map(stats => ({
        status: true,
        logs: [], // Empty logs array as this is stats-only
        totalCount: stats.totalCount,
        filtered: !!source || !!startDate || !!endDate,
        timestamp: new Date().toISOString(),
        stats: {
          byLevel: stats.byLevel,
          bySource: stats.bySource
        }
      } as LogQueryResponse)),
      catchError(error => {
        this.logger.error(`Failed to retrieve log statistics: ${error.message}`, error.stack);
        throw new HttpException(
          { message: 'Failed to retrieve log statistics', error: error.message },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      })
    );
  }

  @Get(':id')
  getLogById(@Param('id') id: string): Observable<LogQueryResponse> {
    return this.loggerService.getLogById(id).pipe(
      map(log => {
        if (!log) {
          throw new HttpException('Log entry not found', HttpStatus.NOT_FOUND);
        }
        
        return {
          status: true,
          logs: log ? [log] : [],
          totalCount: log ? 1 : 0,
          filtered: true,
          timestamp: new Date().toISOString()
        } as LogQueryResponse;
      }),
      catchError(error => {
        if (error instanceof HttpException) {
          throw error;
        }
        
        this.logger.error(`Failed to retrieve log by ID: ${error.message}`, error.stack);
        throw new HttpException(
          { message: 'Failed to retrieve log by ID', error: error.message },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      })
    );
  }

  @Delete(':id')
  async deleteLog(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(this.loggerService.deleteLog(id));
      
      if (!result) {
        throw new HttpException('Log entry not found or could not be deleted', HttpStatus.NOT_FOUND);
      }
      
      return {
        status: true,
        message: 'Log entry deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to delete log: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to delete log', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete()
  async clearLogs(
    @Query('before') before?: string,
    @Query('level') level?: LogLevelEnum,
    @Query('source') source?: string
  ): Promise<{
    status: boolean;
    deletedCount: number;
    message: string;
    timestamp: string;
  }> {
    try {
      // For safety, require at least one filter parameter
      if (!before && !level && !source) {
        throw new HttpException(
          { message: 'At least one filter parameter is required for bulk deletion' },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const filter: Partial<LogFilter> = {};
      if (before) filter.endDate = before;
      if (level) filter.level = level;
      if (source) filter.service = source;
      
      const result = await firstValueFrom(this.loggerService.clearLogs(filter));
      
      return {
        status: true,
        deletedCount: result,
        message: `Successfully deleted ${result} log entries`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to clear logs: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to clear logs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
