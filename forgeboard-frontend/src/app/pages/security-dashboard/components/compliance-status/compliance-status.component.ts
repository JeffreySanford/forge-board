import { Component, OnInit } from '@angular/core';
import { LoggerService } from '../../../../services/logger.service';

@Component({
  selector: 'app-compliance-status',
  templateUrl: './compliance-status.component.html',
  styleUrls: ['./compliance-status.component.scss'],
  standalone: false,
})
export class ComplianceStatusComponent implements OnInit {
  constructor(private logger: LoggerService) {}

  ngOnInit(): void {
    this.logger.info('ComplianceStatusComponent initialized');
  }
}
