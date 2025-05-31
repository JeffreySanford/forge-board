import { Module } from '@nestjs/common';
import { SeedKanbanCommand } from '../kanban/commands/seed-kanban.command';
import { KanbanModule } from '../kanban/kanban.module';

@Module({
  imports: [KanbanModule],
  providers: [SeedKanbanCommand],
})
export class CommandsModule {}
