import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './models/user.model';
import { Log } from './models/log.model';
import { Metric } from './models/metric.model';
import { Diagnostic } from './models/diagnostic.model';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(Metric.name) private metricModel: Model<Metric>,
    @InjectModel(Diagnostic.name) private diagnosticModel: Model<Diagnostic>,
  ) {}

  async onModuleInit() {
    if (process.env.USE_IN_MEMORY_MONGO === 'true') {
      await this.seedUsers();
      await this.seedLogs();
      await this.seedMetrics();
      await this.seedDiagnostics();
      this.logger.log('In-memory MongoDB seeded with initial data.');
    }
  }

  private async seedUsers() {
    if ((await this.userModel.countDocuments()) === 0) {
      await this.userModel.create([
        { username: 'admin', password: 'admin', role: 'admin' },
        { username: 'user', password: 'user', role: 'user' },
      ]);
    }
  }

  private async seedLogs() {
    if ((await this.logModel.countDocuments()) === 0) {
      await this.logModel.create([
        { level: 'info', message: 'System started', timestamp: new Date(), source: 'system' },
        { level: 'error', message: 'Sample error', timestamp: new Date(), source: 'system' },
      ]);
    }
  }

  private async seedMetrics() {
    if ((await this.metricModel.countDocuments()) === 0) {
      await this.metricModel.create([
        { type: 'cpu', value: 0.5, timestamp: new Date(), cpu: 0.5 },
        { type: 'memory', value: 0.7, timestamp: new Date(), memory: 0.7 },
      ]);
    }
  }

  private async seedDiagnostics() {
    if ((await this.diagnosticModel.countDocuments()) === 0) {
      await this.diagnosticModel.create([
        { type: 'startup', eventType: 'info', timestamp: new Date(), source: 'system', message: 'Diagnostics started' },
      ]);
    }
  }
}
