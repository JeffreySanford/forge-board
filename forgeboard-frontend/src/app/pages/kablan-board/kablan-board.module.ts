import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KablanBoardComponent } from './kablan-board.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [KablanBoardComponent],
  imports: [CommonModule, DragDropModule],
  exports: [KablanBoardComponent]
})
export class KablanBoardModule {}
