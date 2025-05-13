import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { KanbanBoardComponent } from './pages/kanban-board/kanban-board.component';
import { MetricComponent } from './pages/metrics/metric.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { LoggerViewComponent } from './pages/logger/logger-view.component';
import { DiagnosticsComponent } from './pages/diagnostics/diagnostics.component'; 
import { SecurityDashboardComponent } from './pages/security-dashboard/security-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'metrics', component: MetricComponent },
  { path: 'diagnostics', component: DiagnosticsComponent },
  { path: 'kanban', component: KanbanBoardComponent },
  { path: 'logs', component: LoggerViewComponent },
  { path: 'security', component: SecurityDashboardComponent },
  { 
    path: 'sockets', 
    loadChildren: () => import('./pages/socket/socket.module').then(m => m.SocketModule),
  },
  { path: 'socket-monitoring', redirectTo: '/sockets', pathMatch: 'full' },
  { path: 'documentation', loadChildren: () => import('./pages/documentation/documentation.module').then(m => m.DocumentationModule) },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' } // Redirect all unknown routes to 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
