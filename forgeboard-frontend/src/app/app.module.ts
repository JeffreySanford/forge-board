import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { MatCardModule } from '@angular/material/card';
// Remove unused import
// import { MetricsInfographicComponent } from './tiles/metrics/metrics-infographic.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MetricsInfographicModule } from './tiles/metrics/metrics-inforgraphic.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConnectionStatusComponent } from './tiles/connection-status/connection-status.component';
import { RecentLogsComponent } from './tiles/recent-logs/recent-logs.component';
import { UptimeSummaryComponent } from './tiles/uptime-summary/uptime-summary.component';
import { ActivityFeedComponent } from './tiles/activity-feed/activity-feed.component';
import { MetricsIndicatorComponent } from './metrics/metrics-indicator.component';
import { LetterAnimatorDirective } from './letter-animator.directive';

@NgModule({
  declarations: [
    AppComponent,
    ConnectionStatusComponent,
    RecentLogsComponent,
    UptimeSummaryComponent,
    ActivityFeedComponent,
    MetricsIndicatorComponent,
    LetterAnimatorDirective  // Add the new directive
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    MatCardModule,
    HttpClientModule, // Add HttpClientModule here
    MatSliderModule, // Add MatSliderModule
    MatDividerModule, // Add MatDividerModule
    MatIconModule,
    MetricsInfographicModule,
    MatToolbarModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
