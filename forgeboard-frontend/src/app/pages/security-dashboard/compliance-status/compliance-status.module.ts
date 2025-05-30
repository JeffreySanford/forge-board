import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComplianceStatusRoutingModule } from './compliance-status-routing.module';
import { ComplianceStatusComponent } from './compliance-status.component';
import { LoggerService } from '../../../services/logger.service';

@NgModule({
  declarations: [ComplianceStatusComponent],
  imports: [CommonModule, ComplianceStatusRoutingModule],
  providers: [LoggerService],
  exports: [ComplianceStatusComponent],
})
export class ComplianceStatusModule {}
