import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KanbanService } from './kanban.service';
import { KanbanSocketGateway } from './kanban-socket.gateway';
import { KanbanController } from './kanban.controller';
import { KanbanBoard, KanbanBoardSchema } from '../models/kanban.model';
import { LoggerModule } from '../logger/logger.module';
import { KanbanSeedService } from './kanban-seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
    ]),
    LoggerModule,
  ],
  controllers: [KanbanController],
  providers: [KanbanService, KanbanSocketGateway, KanbanSeedService],
  exports: [KanbanService, KanbanSeedService],
})
export class KanbanModule {}
