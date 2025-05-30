import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SecurityAlertsRoutingModule } from './security-alerts-routing.module';
import { SecurityAlertsComponent } from './security-alerts.component';


@NgModule({
  declarations: [
    SecurityAlertsComponent
  ],
  imports: [
    CommonModule,
    SecurityAlertsRoutingModule
  ]
})
export class SecurityAlertsModule { }
