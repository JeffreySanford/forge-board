import { Controller, Get, Post, Body, Inject, Logger, Res, HttpStatus } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from '../gateways/diagnostics.gateway';
import type { DiagnosticEvent } from '@forge-board/shared/api-interfaces';
import { Response } from 'express';

// Define DiagnosticEventResponse interface
export interface DiagnosticEventResponse {
  success: boolean;
  timestamp: string;
  id: string;
  eventType: string;
}

@Controller('diagnostics')
export class DiagnosticsController {
  private readonly logger = new Logger(DiagnosticsController.name);
  
  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    @Inject(DiagnosticsGateway) private readonly diagnosticsGateway: DiagnosticsGateway
  ) {}
  
  @Get('health')
  getHealth(@Res() res: Response) {
    this.logger.log('GET /diagnostics/health');
    const { data, unchanged } = this.diagnosticsService.getHealthWithChangeFlag();
    if (unchanged) {
      // 203 Non-Authoritative Information (used here for 'not changed')
      return res.status(203).json({ message: 'Health data not changed', data });
    }
    return res.status(HttpStatus.OK).json(data);
  }
  
  @Get('services')
  getServicesAndControllers() {
    this.logger.log('GET /diagnostics/services');
    return this.diagnosticsService.getServicesAndControllers();
  }
  
  @Post('event')
  registerDiagnosticEvent(@Body() event: DiagnosticEvent) {
    this.logger.log(`Diagnostic event registered: ${event.eventType} - ${event.message}`);
    this.diagnosticsGateway.emitDiagnosticEvent(event);
    return { success: true, message: 'Event registered' };
  }
}
