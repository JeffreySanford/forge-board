import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

// Feature modules
import { KablanBoardModule } from './pages/kablan-board/kablan-board.module';
import { MetricsModule } from './pages/metrics/metrics.module';
import { HomeModule } from './pages/home/home.module';
import { NavigationModule } from './components/navigation/navigation.module';
import { NotFoundModule } from './pages/not-found/not-found.module';
import { FooterModule } from './components/footer/footer.module';
import { LoggerPageModule } from './pages/logger/logger.module';

// Services and interceptors
import { ErrorService } from './services/error.service';
import { ApiErrorInterceptor } from './interceptors/api-error.interceptor';
import { TypeValidationInterceptor } from './interceptors/type-validation.interceptor';
import { TypeDiagnosticsService } from './services/type-diagnostics.service';

import { ConnectionStatusIndicatorComponent } from './components/connection-status-indicator/connection-status-indicator.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    
    // Feature modules
    KablanBoardModule,
    MetricsModule,
    HomeModule,
    NavigationModule,
    NotFoundModule,
    FooterModule,
    LoggerPageModule, // Add Logger Page Module
    
    // Standalone components
    ConnectionStatusIndicatorComponent
  ],
  providers: [
    ErrorService,
    { provide: HTTP_INTERCEPTORS, useClass: TypeValidationInterceptor, multi: true },
    TypeDiagnosticsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
