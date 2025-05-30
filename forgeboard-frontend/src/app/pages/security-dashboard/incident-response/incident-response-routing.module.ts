import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IncidentResponseComponent } from './incident-response.component';

const routes: Routes = [
  { path: '', component: IncidentResponseComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IncidentResponseRoutingModule { }
