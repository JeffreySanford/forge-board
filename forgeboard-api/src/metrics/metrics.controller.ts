import { Controller, Get, Query } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  private interval = 500;

  @Get('set-interval')
  setInterval(@Query('interval') intervalStr: string) {
    const interval = parseInt(intervalStr, 10);
    if (!isNaN(interval) && interval >= 100 && interval <= 10000) {
      this.interval = interval;
      return { success: true, interval };
    }
    return { success: false, message: 'Invalid interval' };
  }

  @Get('status')
  getStatus() {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      interval: this.interval
    };
  }
}
