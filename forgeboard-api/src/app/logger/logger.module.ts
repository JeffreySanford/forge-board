import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { LoggerGateway } from './logger.gateway';

@Global()
@Module({
  providers: [LoggerService, LoggerGateway],
  controllers: [LoggerController],
  exports: [LoggerService]
})
export class LoggerModule {}
