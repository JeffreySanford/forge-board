import { Controller, Get, Logger } from '@nestjs/common';
import { JwtDiagnosticsService, AuthDiagnosticEvent, AuthStats } from './jwt-diagnostics.service';

@Controller('diagnostics/auth')
export class JwtDiagnosticsController {
  private readonly logger = new Logger(JwtDiagnosticsController.name);
  
  constructor(private readonly jwtDiagnostics: JwtDiagnosticsService) {}
  
  @Get('events')
  getAuthEvents(): AuthDiagnosticEvent[] {
    this.logger.log('GET /diagnostics/auth/events');
    return this.jwtDiagnostics.getCurrentEvents();
  }
  
  @Get('stats')
  getAuthStats(): AuthStats {
    this.logger.log('GET /diagnostics/auth/stats');
    return this.jwtDiagnostics.getCurrentStats();
  }
}
