import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InfrastructureScanDetailRoutingModule } from './infrastructure-scan-detail-routing.module';
import { InfrastructureScanDetailComponent } from './infrastructure-scan-detail.component';


@NgModule({
  declarations: [
    InfrastructureScanDetailComponent
  ],
  imports: [
    CommonModule,
    InfrastructureScanDetailRoutingModule
  ]
})
export class InfrastructureScanDetailModule { }
