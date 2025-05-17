import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
import { KanbanSocketGateway } from './kanban-socket.gateway';
import { KanbanBoard, KanbanBoardSchema } from '../models/kanban.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KanbanBoard.name, schema: KanbanBoardSchema }
    ])
  ],
  controllers: [KanbanController],
  providers: [KanbanService, KanbanSocketGateway],
  exports: [KanbanService],
})
export class KanbanModule {}
