import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SecurityAlertsComponent } from './security-alerts.component';

const routes: Routes = [
  { path: '', component: SecurityAlertsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityAlertsRoutingModule { }
