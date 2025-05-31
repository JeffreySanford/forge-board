import { Module } from '@nestjs/common';
import { ReactiveConfigService } from './reactive-config.service';

@Module({
  providers: [ReactiveConfigService],
  exports: [ReactiveConfigService],
})
export class ConfigModule {}
