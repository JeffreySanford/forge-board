import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { MaterialModule } from './shared/material.module'; // Import our shared material module

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

// Feature modules
import { KanbanBoardModule } from './pages/kanban-board/kanban-board.module';
import { MetricModule } from './pages/metrics/metric.module';
import { HomeModule } from './pages/home/home.module';
import { NavigationModule } from './components/navigation/navigation.module';
import { NotFoundModule } from './pages/not-found/not-found.module';
import { FooterModule } from './components/footer/footer.module';
import { LoggerModule } from './pages/logger/logger.module'; // Fixed: was LoggerPageModule
import { DocumentationModule } from './pages/documentation/documentation.module';
import { SecurityDashboardModule } from './pages/security-dashboard/security-dashboard.module';

// Core modules
import { SoundModule } from './core/sounds/sound.module';  // Add the SoundModule

// Angular Material modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Services and interceptors
import { ErrorService } from './services/error.service';
import { ApiErrorInterceptor } from './interceptors/api-error.interceptor';
import { TypeValidationInterceptor } from './interceptors/type-validation.interceptor';
import { ProjectConfigService } from './services/project-config.service';
import { TypeDiagnosticsService } from './services/type-diagnostics.service';

// Feature modules
import { ConnectionStatusIndicatorModule } from './components/connection-status-indicator/connection-status-indicator.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    RouterModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    
    // Angular Material Modules via shared module
    MaterialModule,
    // Individual Material modules for backward compatibility
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatDividerModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    DragDropModule,
    
    // Feature modules
    KanbanBoardModule,
    MetricModule,
    HomeModule,
    NavigationModule,
    NotFoundModule,
    FooterModule,
    LoggerModule, // Fixed: was LoggerPageModule
    DocumentationModule,
    SecurityDashboardModule,
    ConnectionStatusIndicatorModule,
    SoundModule // Import SoundModule here
  ],
  providers: [
    DatePipe, // Add DatePipe to providers
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
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA], // Add schemas to be more permissive with templates
  bootstrap: [AppComponent]
})
export class AppModule { }
