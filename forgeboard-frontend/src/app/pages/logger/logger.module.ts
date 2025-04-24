import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
// Fix import name - use LoggerModule instead of LoggerComponentsModule
import { LoggerModule } from '../../components/logger/logger.module';
import { LoggerViewComponent } from './logger-view.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    LoggerViewComponent
  ],
  imports: [
    SharedModule,
    LoggerModule // Use LoggerModule directly
  ],
  exports: [
    LoggerViewComponent
  ]
})
export class LoggerPageModule { } // This class has the @NgModule decorator now
