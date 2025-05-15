import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { LoggerGateway } from './logger.gateway';
import { Log, LogSchema } from '../models/log.model';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])
  ],
  providers: [LoggerService, LoggerGateway],
  controllers: [LoggerController],
  exports: [LoggerService]
})
export class LoggerModule {}
