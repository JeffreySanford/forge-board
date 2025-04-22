import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { KablanBoardComponent } from './pages/kablan-board/kablan-board.component';
import { MetricComponent } from './pages/metrics/metric.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'metrics', component: MetricComponent },
  { path: 'kablan', component: KablanBoardComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' } // Redirect all unknown routes to 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
