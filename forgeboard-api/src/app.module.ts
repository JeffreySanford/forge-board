import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './app/metrics/metrics.module';
import { DiagnosticsModule } from './app/diagnostics/diagnostics.module';
import { KablanModule } from './app/kablan/kablan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MetricsModule,
    DiagnosticsModule,
    KablanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
