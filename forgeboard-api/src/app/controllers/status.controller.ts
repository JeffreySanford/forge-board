import { Controller, Get, Param } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Controller('status')
export class StatusController {
  private readonly logger = new Logger(StatusController.name);
  
  @Get()
  getStatus() {
    this.logger.log('GET /status - Health check endpoint accessed');
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        metrics: {
          available: true,
          status: 'online'
        },
        diagnostics: {
          available: true,
          status: 'online'
        }
      }
    };
  }
  
  @Get('service/:name')
  getServiceStatus(@Param('name') serviceName: string) {
    this.logger.log(`GET /status/service/${serviceName}`);
    
    const services = {
      metrics: {
        available: true,
        status: 'online',
        lastUpdated: new Date().toISOString()
      },
      diagnostics: {
        available: true,
        status: 'online',
        lastUpdated: new Date().toISOString()
      },
      auth: {
        available: true,
        status: 'online',
        lastUpdated: new Date().toISOString()
      },
      users: {
        available: true,
        status: 'online', 
        lastUpdated: new Date().toISOString()
      }
    };
    
    if (serviceName in services) {
      return services[serviceName];
    }
    
    return {
      available: false,
      status: 'unknown',
      message: `Service "${serviceName}" not found`
    };
  }
  
  @Get('socket-health')
  getSocketHealth() {
    this.logger.log('GET /status/socket-health');
    
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      connections: {
        metrics: true,
        diagnostics: true
      }
    };
  }
}
