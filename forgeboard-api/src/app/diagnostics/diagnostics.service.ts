import { Injectable, Logger } from '@nestjs/common';
import { HealthData } from '@forge-board/shared/api-interfaces';
import { v4 as uuidv4 } from 'uuid';

// Add DiagnosticEventResponse interface definition
interface DiagnosticEventResponse {
  success: boolean;
  timestamp: string;
  id: string;
  eventType: string;
}

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);
  private readonly startTime = Date.now();
  private errorLog: string[] = [];
  
  constructor() {
    this.logger.log('Diagnostics Service initialized');
  }
  
  logError(msg: string) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    this.logger.error(formattedMsg);
    
    this.errorLog.push(formattedMsg);
    if (this.errorLog.length > 50) this.errorLog.shift(); // Keep only the last 50 errors
  }

  getServicesAndControllers() {
    return {
      services: [
        'AppService', 
        'MetricsService', 
        'DiagnosticsService', 
        'TileStateService',
        'SocketRegistryService',
        'SocketLoggerService'
      ],
      controllers: [
        'AppController', 
        'MetricsController', 
        'DiagnosticsController', 
        'TileStateController',
        'StatusController'
      ],
      gateways: [
        'MetricsGateway', 
        'DiagnosticsGateway',
        'SocketGateway'
      ],
      errors: this.errorLog,
      health: this.getHealth()
    };
  }

  getHealth(): HealthData {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';
    if (uptime > 0) {
      status = uptime > 60 ? 'healthy' : 'unknown';
    }
    return {
      status,
      uptime,
      timestamp: new Date().toISOString(),
      details: {
        past: {
          message: `Server started ${uptime} seconds ago. Initial status was "${uptime > 10 ? 'healthy' : 'unknown'}".`
        },
        present: {
          message: `Server is currently "${status}" with uptime of ${uptime} seconds.`
        },
        future: {
          message: `If current trends continue, the server is expected to remain "${status}" and stable.`
        }
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
