import { Module } from '@nestjs/common';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
import { KanbanSocketGateway } from './kanban-socket.gateway';

@Module({
  controllers: [KanbanController],
  providers: [KanbanService, KanbanSocketGateway],
  exports: [KanbanService],
})
export class KanbanModule {}
