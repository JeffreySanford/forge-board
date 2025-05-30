import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SbomStatusDetailRoutingModule } from './sbom-status-detail-routing.module';
import { SbomStatusDetailComponent } from './sbom-status-detail.component';


@NgModule({
  declarations: [
    SbomStatusDetailComponent
  ],
  imports: [
    CommonModule,
    SbomStatusDetailRoutingModule
  ]
})
export class SbomStatusDetailModule { }
