import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-threat-intelligence',
  templateUrl: './threat-intelligence.component.html',
  styleUrls: ['./threat-intelligence.component.scss'],
  standalone: false
})
export class ThreatIntelligenceComponent implements OnInit {
  threats = [
    { 
      id: 'TH-001', 
      name: 'Advanced Persistent Threat', 
      severity: 'high', 
      source: 'External Intelligence', 
      lastUpdated: new Date(),
      description: 'Sophisticated threat actor targeting critical infrastructure'
    },
    { 
      id: 'TH-002', 
      name: 'Ransomware Campaign', 
      severity: 'high', 
      source: 'CISA Alert', 
      lastUpdated: new Date(Date.now() - 86400000),
      description: 'Active ransomware campaign targeting financial institutions'
    },
    { 
      id: 'TH-003', 
      name: 'Phishing Campaign', 
      severity: 'medium', 
      source: 'Internal SOC', 
      lastUpdated: new Date(Date.now() - 172800000),
      description: 'Phishing emails impersonating IT department'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('[ThreatIntelligenceComponent] Initialized');
  }

  getStatusColor(severity: string): string {
    switch(severity.toLowerCase()) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#3498db';
      default: return '#7f8c8d';
    }
  }
}
