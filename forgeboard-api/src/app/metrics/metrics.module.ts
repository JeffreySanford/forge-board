import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsGateway } from './metrics.gateway';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [SocketModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsGateway],
  exports: [MetricsService]
})
export class MetricsModule {}
