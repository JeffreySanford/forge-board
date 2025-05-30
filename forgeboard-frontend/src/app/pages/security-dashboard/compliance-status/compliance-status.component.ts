import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'app-compliance-status',
  standalone: false,
  templateUrl: './compliance-status.component.html',
  styleUrl: './compliance-status.component.scss',
})
export class ComplianceStatusComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loggerService: LoggerService // <-- Injecting LoggerService directly
  ) {}

  ngOnInit(): void {
    this.loggerService.info(
      '[Logger] Navigated to Compliance Status tab:',
      this.router.url
    );
  }
}
