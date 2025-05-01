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
import { ProjectConfigService } from './services/project-config.service';
import { TypeDiagnosticsService } from './services/type-diagnostics.service';

// Standalone components
import { ConnectionStatusIndicatorComponent } from './components/connection-status-indicator/connection-status-indicator.component';
import { DocumentationModule } from './pages/documentation/documentation.module';

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
    LoggerPageModule,
    DocumentationModule,
    
    // Standalone components
    ConnectionStatusIndicatorComponent
  ],
  providers: [
    ErrorService,
    TypeDiagnosticsService,
    ProjectConfigService,
    // Order matters for HTTP interceptors to avoid circular dependencies
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: ApiErrorInterceptor, 
      multi: true 
    },
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: TypeValidationInterceptor, 
      multi: true 
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
