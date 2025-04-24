import { Module } from '@nestjs/common';
import { MetricsGateway } from '../app/gateways/metrics.gateway';

@Module({
  providers: [
    // Register the metrics gateway
    MetricsGateway
  ],
  exports: [
    // Export the metrics gateway
    MetricsGateway
  ]
})
export class SocketModule {}
