import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger.service';

export interface AuditEvent {
  action: string;
  actor?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

@Injectable()
export class AuditService {
  constructor(private readonly logger: LoggerService) {}

  log(event: AuditEvent): void {
    const logLevel = event.success ? 'info' : 'warn';
    const context = 'Audit';
    
    this.logger[logLevel](`${event.action}: ${event.success ? 'success' : 'failed'}`, context, {
      actor: event.actor || 'system',
      resource: event.resource,
      resourceId: event.resourceId,
      ...event.details,
    });
    
    // In a real implementation, you would also persist this to a database
  }
}
