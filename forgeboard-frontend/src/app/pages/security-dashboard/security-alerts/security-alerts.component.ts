import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-security-alerts',
  standalone: false,
  templateUrl: './security-alerts.component.html',
  styleUrl: './security-alerts.component.scss'
})
export class SecurityAlertsComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('[Logger] Navigated to Security Alerts tab:', this.router.url);
  }
}
