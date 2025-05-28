import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics/metrics.module';
import { SocketModule } from './socket/socket.module';
import { StatusModule } from './status/status.module';
import { TilesModule } from './tiles/tiles.module';
import { MetricsGateway } from './gateways/metrics.gateways';
import { DiagnosticsGateway } from './gateways/diagnostics.gateway';
import { DiagnosticsController } from './diagnostics/diagnostics.controller';
import { DiagnosticsService } from './diagnostics/diagnostics.service';
import { SocketRegistryService } from './socket/socket-registry.service';
import { StatusController } from './controllers/status.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { TileStateController } from './tiles/tile-state.controller';
import { LoggerModule } from './logger/logger.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { TileStateModule } from './tile-state/tile-state.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthGateway } from './auth/auth.gateway';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { WsJwtGuard } from './auth/ws-jwt.guard';
import { JwtService } from './auth/jwt.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, UserSchema } from './models/user.model';
import { Log, LogSchema } from './models/log.model';
import { Metric, MetricSchema } from './models/metric.model';
import { Diagnostic, DiagnosticSchema } from './models/diagnostic.model';
import { KanbanBoard, KanbanBoardSchema } from './models/kanban.model';
import { SeedService } from './seed.service';
import { SecurityStreamGateway } from './security/scanner-service/security-stream.gateway';
import { LogsModule } from './logs/logs.module';
import { SystemModule } from './system/system.module';
import { Sound, SoundSchema } from './models/sound.model';
import { KanbanModule } from './kanban/kanban.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let uri = configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/forgeboard');
        if (configService.get<string>('USE_IN_MEMORY_MONGO') === 'true') {
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
          // Optionally, store mongod instance for shutdown
          console.log('[MongoMemoryServer] Started in-memory MongoDB at', uri);
        }
        return {
          uri,
          // Removing deprecated options that are no longer needed in MongoDB driver v4.0+
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Metric.name, schema: MetricSchema },
      { name: Diagnostic.name, schema: DiagnosticSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: Sound.name, schema: SoundSchema }, // Add Sound schema
    ]),
    MetricsModule,
    SocketModule,
    StatusModule,
    TilesModule,
    LoggerModule,
    DiagnosticsModule,
    TileStateModule,
    AuthModule,
    UserModule,
    LogsModule, // Add LogsModule here
    // JwtModule removed for v10+
    SystemModule,
    KanbanModule,
  ],
  controllers: [
    AppController,
    DiagnosticsController,
    StatusController,
    MetricsController,
    TileStateController,
    AuthController,
  ],
  providers: [
    AppService,
    MetricsGateway,
    DiagnosticsGateway,
    DiagnosticsService,
    SocketRegistryService,
    MetricsService,
    {
      provide: Logger,
      useValue: new Logger('AppModule'),
    },
    AuthService, 
    AuthGateway, 
    JwtAuthGuard, 
    WsJwtGuard,
    JwtService,
    SeedService,
    SecurityStreamGateway,
  ],
  exports: [AuthService, JwtAuthGuard, WsJwtGuard, JwtService]
})
export class AppModule {
  constructor(private readonly configService: ConfigService, private readonly seedService: SeedService) {
    const useInMemory = this.configService.get<string>('USE_IN_MEMORY_MONGO') === 'true';
    if (!useInMemory) {
      const dbUri = this.configService.get<string>('MONGODB_URI');
      const dbName = this.configService.get<string>('DB_NAME');
      const dbUser = this.configService.get<string>('DB_USER');
      const dbPassword = this.configService.get<string>('DB_PASSWORD');
      if (!dbUri || !dbName || !dbUser || !dbPassword) {
        throw new Error('Database configuration is missing');
      }
    }
    // In-memory seeding is handled by SeedService.onModuleInit()
  }
}
