import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { KablanBoardComponent } from './kablan-board.component';

@NgModule({
  declarations: [KablanBoardComponent],
  imports: [
    SharedModule
  ],
  exports: [KablanBoardComponent]
})
export class KablanBoardModule {}
