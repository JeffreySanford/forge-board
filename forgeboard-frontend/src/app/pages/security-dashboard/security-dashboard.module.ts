import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Import components
import { SecurityDashboardComponent } from './security-dashboard.component';
import { AccessControlComponent } from './access-control/access-control.component';
import { ThreatIntelligenceComponent } from './threat-intelligence/threat-intelligence.component';
import { SecurityTileComponent } from './components/security-tile/security-tile.component';
import { SecurityFooterComponent } from './components/security-footer/security-footer.component';
import { SecurityAlertsComponent } from './components/security-alerts/security-alerts.component';
import { IncidentResponseComponent } from './components/incident-response/incident-response.component';
import { ComplianceStatusComponent } from './components/compliance-status/compliance-status.component';
import { AssetInventoryComponent } from './components/asset-inventory/asset-inventory.component';

// Import shared module that may contain other material components
import { MaterialModule } from '../../shared/material.module';

@NgModule({
  declarations: [
    SecurityDashboardComponent,
    AccessControlComponent,
    ThreatIntelligenceComponent,
    SecurityTileComponent,
    SecurityFooterComponent,
    SecurityAlertsComponent,
    IncidentResponseComponent,
    ComplianceStatusComponent,
    AssetInventoryComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MaterialModule,

    // Angular Material Modules
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatListModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  exports: [
    SecurityDashboardComponent,
    AccessControlComponent,
    ThreatIntelligenceComponent,
    SecurityTileComponent,
    SecurityFooterComponent,
    SecurityAlertsComponent,
    IncidentResponseComponent,
    ComplianceStatusComponent,
    AssetInventoryComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add schema for custom elements
})
export class SecurityDashboardModule {
  constructor() {
    console.log('[SecurityDashboardModule] Module initialized');
  }
}
