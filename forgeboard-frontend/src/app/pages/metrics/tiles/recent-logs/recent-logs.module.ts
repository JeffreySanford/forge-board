import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentLogsComponent } from './recent-logs.component';
import { LoggerModule } from '../../../../components/logger/logger.module';

@NgModule({
  declarations: [RecentLogsComponent],
  imports: [
    CommonModule,
    LoggerModule
  ],
  exports: [RecentLogsComponent]
})
export class RecentLogsModule { }
