import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { KanbanBoardComponent } from './kanban-board.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanBoardRoutingModule } from './kanban-board-routing.module';
import { MaterialModule } from '../../shared/material.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [KanbanBoardComponent],
  imports: [
    CommonModule,
    SharedModule,
    DragDropModule,
    KanbanBoardRoutingModule,
    MaterialModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  exports: [KanbanBoardComponent]
})
export class KanbanBoardModule {}
