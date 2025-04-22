import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsGateway } from '../gateways/diagnostics.gateway';

// Centralized Health type
export interface Health {
  status: string;
  uptime: number;
  details: {
    past: string;
    present: string;
    future: string;
    [key: string]: unknown;
  };
}

// Add a more specific event response type
export interface DiagnosticEventResponse {
  success: boolean;
  timestamp: string;
  id: string; // Unique event ID
  eventType: string;
}

@Controller('api/diagnostics')
export class DiagnosticsController {
  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    @Inject(DiagnosticsGateway) private readonly diagnosticsGateway: DiagnosticsGateway
  ) {}

  @Get('services')
  getServicesAndControllers() {
    return this.diagnosticsService.getServicesAndControllers();
  }

  @Get('health')
  getHealth(): Health {
    return this.diagnosticsService.getHealth();
  }

  @Post('event')
  registerEvent(@Body() body: { event: string }): DiagnosticEventResponse {
    // Register the event with the service
    const eventResponse = this.diagnosticsService.registerEvent(body.event);
    
    // Emit the event to all connected clients via socket
    this.diagnosticsGateway.emitDiagnosticEvent({
      event: body.event,
      timestamp: eventResponse.timestamp,
      id: eventResponse.id
    });
    
    // Return detailed response to HTTP caller
    return eventResponse;
  }
}
