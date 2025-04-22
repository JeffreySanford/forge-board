import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { LetterAnimatorDirective } from './letter-animator.directive';
import { KablanBoardModule } from './pages/kablan-board/kablan-board.module';
import { MetricsModule } from './pages/metrics/metrics.module';
import { HomeModule } from './pages/home/home.module';
import { NavigationModule } from './components/navigation/navigation.module';
import { NotFoundModule } from './pages/not-found/not-found.module';
import { ErrorService } from './services/error.service';
import { ApiErrorInterceptor } from './interceptors/api-error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LetterAnimatorDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MatCardModule,
    MatSliderModule,
    MatDividerModule,
    MatIconModule,
    MatToolbarModule,
    DragDropModule,
    KablanBoardModule,
    MetricsModule,
    HomeModule,
    NavigationModule,
    NotFoundModule
  ],
  providers: [
    ErrorService,
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: ApiErrorInterceptor, 
      multi: true 
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
