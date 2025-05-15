import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { KanbanBoardComponent } from './kanban-board.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanBoardRoutingModule } from './kanban-board-routing.module';
import { MaterialModule } from '../../shared/material.module';

@NgModule({
  declarations: [KanbanBoardComponent],
  imports: [
    SharedModule,
    DragDropModule,
    KanbanBoardRoutingModule,
    MaterialModule // Use shared MaterialModule for all Material components
  ],
  exports: [KanbanBoardComponent]
})
export class KanbanBoardModule {}
