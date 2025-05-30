import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SbomStatusDetailComponent } from './sbom-status-detail.component';

const routes: Routes = [{ path: '', component: SbomStatusDetailComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SbomStatusDetailRoutingModule { }
