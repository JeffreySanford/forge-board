import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './app/metrics/metrics.module';
import { DiagnosticsModule } from './app/diagnostics/diagnostics.module';
import { KanbanModule } from './app/kanban/kanban.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MetricsModule,
    DiagnosticsModule,
    KanbanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
