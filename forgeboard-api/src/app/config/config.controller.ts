import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReactiveConfigService, AppConfig } from './reactive-config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ReactiveConfigService) {}

  @Get()
  getConfig(): Observable<AppConfig> {
    return this.configService.config$;
  }

  @Get('environment')
  getEnvironment(): Observable<{ environment: string }> {
    return this.configService.environment$.pipe(
      map((environment) => ({ environment }))
    );
  }

  @Get('features')
  getFeatures(): Observable<{ features: Record<string, boolean> }> {
    return this.configService.features$.pipe(map((features) => ({ features })));
  }

  @Post('features/:name')
  setFeature(
    @Param('name') name: string,
    @Body() data: { enabled: boolean }
  ): Observable<{ success: boolean; config: AppConfig }> {
    return this.configService
      .setFeatureFlag(name, data.enabled)
      .pipe(map((config) => ({ success: true, config })));
  }

  @Post('refresh-interval')
  setRefreshInterval(
    @Body() data: { intervalMs: number }
  ): Observable<{ success: boolean; intervalMs: number }> {
    return this.configService
      .setRefreshInterval(data.intervalMs)
      .pipe(map((intervalMs) => ({ success: true, intervalMs })));
  }

  @Post('save')
  saveConfig(): Observable<{ success: boolean }> {
    return this.configService
      .saveConfigToFile()
      .pipe(map((success) => ({ success })));
  }
}
