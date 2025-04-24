import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TilesModule } from './tiles/tiles.module';
import { StatusModule } from './status/status.module';
import { MetricsModule } from './metrics/metrics.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    TilesModule,
    StatusModule,
    MetricsModule,
    SocketModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
