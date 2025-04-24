import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NavigationComponent } from './navigation.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [NavigationComponent],
  imports: [
    SharedModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [NavigationComponent]
})
export class NavigationModule { }
