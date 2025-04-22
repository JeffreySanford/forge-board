import { Injectable } from '@nestjs/common';
import { Health, DiagnosticEventResponse } from './diagnostics.controller';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DiagnosticsService {
  private readonly startTime = Date.now();
  private errorLog: string[] = [];

  logError(msg: string) {
    this.errorLog.push(`[${new Date().toISOString()}] ${msg}`);
    if (this.errorLog.length > 50) this.errorLog.shift();
  }

  getServicesAndControllers() {
    return {
      services: ['AppService', 'MetricsService', 'DiagnosticsService', 'TileStateService'],
      controllers: ['AppController', 'MetricsController', 'DiagnosticsController', 'TileStateController'],
      gateways: ['MetricsGateway', 'DiagnosticsGateway'],
      errors: this.errorLog,
      health: this.getHealth()
    };
  }

  getHealth(): Health {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const status = uptime > 60 ? 'ok' : 'starting';

    return {
      status,
      uptime,
      details: {
        past: `Server started ${uptime} seconds ago. Initial status was "${uptime > 10 ? 'ok' : 'starting'}".`,
        present: `Server is currently "${status}" with uptime of ${uptime} seconds.`,
        future: `If current trends continue, the server is expected to remain "${status}" and stable.`,
      }
    };
  }

  registerEvent(event: string): DiagnosticEventResponse {
    // Log the event or save it to database
    console.log(`Diagnostics event registered: ${event}`);
    
    // Return a properly formatted response object
    return {
      success: true,
      timestamp: new Date().toISOString(),
      id: uuidv4(), // Generate unique ID for the event
      eventType: event
    };
  }
}
