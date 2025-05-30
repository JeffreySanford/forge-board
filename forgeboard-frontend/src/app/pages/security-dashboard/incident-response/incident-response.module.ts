import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncidentResponseRoutingModule } from './incident-response-routing.module';
import { IncidentResponseComponent } from './incident-response.component';


@NgModule({
  declarations: [
    IncidentResponseComponent
  ],
  imports: [
    CommonModule,
    IncidentResponseRoutingModule
  ]
})
export class IncidentResponseModule { }
