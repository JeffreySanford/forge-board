import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComplianceStatusComponent } from './compliance-status.component';

const routes: Routes = [
  { path: '', component: ComplianceStatusComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComplianceStatusRoutingModule { }
