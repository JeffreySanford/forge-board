import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-incident-response',
  standalone: false,
  templateUrl: './incident-response.component.html',
  styleUrl: './incident-response.component.scss'
})
export class IncidentResponseComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('[Logger] Navigated to Incident Response tab:', this.router.url);
  }
}
