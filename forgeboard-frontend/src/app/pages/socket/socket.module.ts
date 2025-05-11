import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SocketDashboardComponent } from './socket-dashboard/socket-dashboard.component';
import { SocketMonitoringComponent } from './socket-dashboard/socket-monitoring/socket-monitoring.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
// Import MatTooltipModule if SocketMonitoringComponent or other children use it.
// import { MatTooltipModule } from '@angular/material/tooltip';

const routes: Routes = [
  {
    path: '',
    component: SocketDashboardComponent, // Parent component for socket section
    children: [
      { path: '', redirectTo: 'monitoring', pathMatch: 'full' },
      { path: 'monitoring', component: SocketMonitoringComponent }
      // Example: { path: 'details/:id', component: SocketDetailComponent },
    ]
  }
];

@NgModule({
  declarations: [
    SocketDashboardComponent,
    SocketMonitoringComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTabsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
    // MatTooltipModule,
  ],
  exports: [
    SocketDashboardComponent, // Export if it's used elsewhere directly
    SocketMonitoringComponent // Export if it's used elsewhere directly
  ]
})
export class SocketModule { }
