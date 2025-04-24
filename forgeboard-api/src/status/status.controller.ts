import { Controller, Get } from '@nestjs/common';

@Controller('status')
export class StatusController {
  @Get()
  getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}
