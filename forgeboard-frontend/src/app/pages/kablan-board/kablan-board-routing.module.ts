import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KablanBoardComponent } from './kablan-board.component';

const routes: Routes = [
  {
    path: '',
    component: KablanBoardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KablanBoardRoutingModule { }
