// The original code is correct - no changes needed
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { KablanBoardComponent } from './kablan-board.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KablanBoardRoutingModule } from './kablan-board-routing.module';

@NgModule({
  declarations: [KablanBoardComponent],
  imports: [
    SharedModule,
    DragDropModule,
    KablanBoardRoutingModule
  ],
  exports: [KablanBoardComponent]
})
export class KablanBoardModule {}
