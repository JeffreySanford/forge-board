import { Controller, Get, Post, Body, Inject, Logger } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from './diagnostics.gateway';
import { DiagnosticEvent, DiagnosticEventResponse } from '@forge-board/shared/diagnostics.types';
import { HealthData } from '@forge-board/shared/api-interfaces';

@Controller('diagnostics')
export class DiagnosticsController {
  private readonly logger = new Logger(DiagnosticsController.name);
  
  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    @Inject(DiagnosticsGateway) private readonly diagnosticsGateway: DiagnosticsGateway
  ) {}
  
  @Get('health')
  getHealth(): HealthData {
    this.logger.log('GET /diagnostics/health');
    return this.diagnosticsService.getHealth();
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
