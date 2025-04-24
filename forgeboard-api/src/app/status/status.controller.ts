import { Controller, Get, Param, Logger } from '@nestjs/common';
import { StatusService } from './status.service';

@Controller('status')
export class StatusController {
  private readonly logger = new Logger(StatusController.name);
  
  constructor(private readonly statusService: StatusService) {}
  
  @Get()
  getStatus() {
    this.logger.log('GET /status');
    return this.statusService.getStatus();
  }
  
  @Get('service/:name')
  checkServiceHealth(@Param('name') name: string) {
    this.logger.log(`GET /status/service/${name}`);
    return this.statusService.checkServiceHealth(name);
  }
  
  @Get('socket-health')
  checkSocketsHealth() {
    this.logger.log('GET /status/socket-health');
    return this.statusService.checkSocketsHealth();
  }
}
