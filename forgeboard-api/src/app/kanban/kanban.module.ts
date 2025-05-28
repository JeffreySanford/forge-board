import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KanbanService } from './kanban.service';
import { KanbanSocketGateway } from './kanban-socket.gateway';
import { KanbanController } from './kanban.controller';
import { KanbanBoard, KanbanBoardSchema } from '../models/kanban.model';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KanbanBoard.name, schema: KanbanBoardSchema }
    ]),
    LoggerModule
  ],
  controllers: [KanbanController],
  providers: [KanbanService, KanbanSocketGateway],
  exports: [KanbanService],
})
export class KanbanModule {}
