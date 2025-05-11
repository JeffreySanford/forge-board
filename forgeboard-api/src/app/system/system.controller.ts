import { Controller, Get, Query } from '@nestjs/common';
import { SystemService, SystemInfo } from './system.service';

@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('info')
  getSystemInfo(): SystemInfo {
    return this.systemService.getSystemInfo();
  }

  @Get('hash')
  generateHash(@Query('data') data: string, @Query('algorithm') algorithm = 'sha256') {
    return this.systemService.generateHash(data, algorithm);
  }
  
  @Get('path/normalize')
  normalizePath(@Query('path') path: string) {
    return this.systemService.normalizePath(path);
  }
  
  @Get('path/join')
  joinPaths(@Query('paths') pathsString: string) {
    const paths = pathsString.split(',');
    return this.systemService.joinPaths(paths);
  }

  @Get('performance')
  getPerformanceMetrics() {
    return this.systemService.getPerformanceMetrics();
  }
}
