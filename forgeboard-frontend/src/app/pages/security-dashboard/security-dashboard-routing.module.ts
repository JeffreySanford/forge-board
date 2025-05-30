import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SecurityDashboardComponent } from './security-dashboard.component';
import { VulnerabilityManagementComponent } from './vulnerability-management/vulnerability-management.component';
import { SecurityAlertsComponent } from './security-alerts/security-alerts.component';
import { IncidentResponseComponent } from './incident-response/incident-response.component';
import { ComplianceStatusComponent } from './compliance-status/compliance-status.component';
import { AssetInventoryComponent } from './asset-inventory/asset-inventory.component';
import { ThreatIntelligenceComponent } from './threat-intelligence/threat-intelligence.component';
import { AccessControlComponent } from './access-control/access-control.component';

const routes: Routes = [
  {
    path: '',
    component: SecurityDashboardComponent,
    children: [
      { path: '', redirectTo: 'vulnerabilities', pathMatch: 'full' },
      { path: 'vulnerabilities', component: VulnerabilityManagementComponent },
      { path: 'alerts', component: SecurityAlertsComponent },
      { path: 'incidents', component: IncidentResponseComponent },
      { path: 'compliance', component: ComplianceStatusComponent },
      { path: 'assets', component: AssetInventoryComponent },
      { path: 'threats', component: ThreatIntelligenceComponent },
      { path: 'access', component: AccessControlComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityDashboardRoutingModule { }
