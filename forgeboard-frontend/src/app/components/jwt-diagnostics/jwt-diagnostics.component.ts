import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { 
  JwtDiagnosticsService,
  JwtPayload,
  JwtVerificationResult,
  TokenVerificationOptions
} from '@forge-board/shared/api-interfaces';
import { 
  JwtDiagnosticEvent, 
  AuthStats 
} from '@forge-board/shared/diagnostics.types';

// Local implementation that will be injected
@Injectable({
  providedIn: 'root'
})
export class JwtDiagnosticsServiceImpl implements JwtDiagnosticsService {
  // Mock data for connection status
  private connected = false;

  // Simple mock implementation for development
  getAuthStats(): Observable<AuthStats> {
    return new Observable<AuthStats>(observer => {
      observer.next({
        totalAttempts: 0,
        successCount: 0,
        failCount: 0,
        lastActivity: new Date().toISOString(),
        activeTokens: 0,
        tokenVerifications: 0,
        failedVerifications: 0
      });
    });
  }
  
  getCurrentStats(): AuthStats {
    return {
      totalAttempts: 0,
      successCount: 0,
      failCount: 0,
      lastActivity: new Date().toISOString(),
      activeTokens: 0,
      tokenVerifications: 0,
      failedVerifications: 0
    };
  }
  
  getAuthEvents(): Observable<AuthDiagnosticEvent[]> {
    return new Observable<AuthDiagnosticEvent[]>(observer => {
      observer.next([]);
    });
  }
  
  getCurrentEvents(): AuthDiagnosticEvent[] {
    return [];
  }
  
  // Implementing the missing required methods from JwtDiagnosticsService
  getToken(): string | null {
    return null;
  }

  putToken(token: string): void {
    console.log('Mock putToken called with:', token);
  }

  // Updated method signature to match the interface
  decodeToken<T extends JwtPayload = JwtPayload>(token?: string): T | null {
    if (!token) return null;
    
    try {
      // Fixed implementation to correctly handle the typing
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      const decodedPayload = JSON.parse(atob(payload)) as T;
      
      // Check if token is expired
      if ('exp' in decodedPayload && typeof decodedPayload.exp === 'number' && 
          decodedPayload.exp * 1000 < Date.now()) {
        return null;
      }
      
      return decodedPayload;
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  isTokenValid(): boolean {
    return false;
  }

  clearToken(): void {
    console.log('Mock clearToken called');
  }
  
  verifyToken(token: string, options?: TokenVerificationOptions): JwtVerificationResult {
    return {
      valid: false,
      error: 'Not implemented in frontend service'
    };
  }

  // Additional methods that are being called in the component
  getConnectionStatus(): Observable<boolean> {
    return of(this.connected);
  }

  // HTTP fallback methods
  getAuthEventsHttp(): Observable<AuthDiagnosticEvent[]> {
    return of([]);
  }

  getAuthStatsHttp(): Observable<AuthStats> {
    return of(this.getCurrentStats());
  }
  
  // Implement additional methods from enhanced service
  getTokenExpiration(): Date | null {
    return null;
  }
  
  logAuthEvent(event: Partial<AuthDiagnosticEvent>): void {
    console.log('Mock logAuthEvent called with:', event);
  }
  
  refreshToken(): Observable<string | null> {
    return of(null);
  }
  
  getUserInfo(): Observable<{id: string, username: string} | null> {
    return of(null);
  }
  
  getTimeUntilExpiration(): number {
    return 0;
  }
  
  hasClaim(claimName: string, expectedValue?: any): boolean {
    return false;
  }
  
  getSubject(): string | null {
    return null;
  }
  
  recordVerificationMetric(success: boolean, errorCode?: string): void {
    console.log('Mock recordVerificationMetric called:', { success, errorCode });
  }
}

@Component({
  selector: 'app-jwt-diagnostics',
  standalone: false,
  template: `
    <div class="jwt-diagnostics-container">
      <h2>JWT Authentication Diagnostics</h2>

      <!-- Connection Status -->
      <div class="connection-status" [ngClass]="connected ? 'connected' : 'disconnected'">
        <mat-icon>{{connected ? 'wifi' : 'wifi_off'}}</mat-icon>
        <span>{{connected ? 'Connected' : 'Disconnected'}}</span>
      </div>

      <!-- Stats Card -->
      <mat-card class="stats-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>analytics</mat-icon>
          <mat-card-title>Authentication Statistics</mat-card-title>
          <mat-card-subtitle>Real-time authentication metrics</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Attempts</div>
              <div class="stat-value">{{stats.totalAttempts}}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Success</div>
              <div class="stat-value success">{{stats.successCount}}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Failures</div>
              <div class="stat-value error">{{stats.failCount}}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Active Tokens</div>
              <div class="stat-value active">{{stats.activeTokens}}</div>
            </div>
            <div class="stat-item full-width">
              <div class="stat-label">Last Activity</div>
              <div class="stat-value">{{stats.lastActivity | date:'medium'}}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Events Card -->
      <mat-card class="events-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>event_note</mat-icon>
          <mat-card-title>Authentication Events</mat-card-title>
          <mat-card-subtitle>Recent authentication activity</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="events-filters">
            <mat-chip-listbox aria-label="Event type selection">
              <mat-chip-option (click)="filterEvents('all')" [selected]="eventFilter === 'all'">All</mat-chip-option>
              <mat-chip-option (click)="filterEvents('success')" [selected]="eventFilter === 'success'">Success</mat-chip-option>
              <mat-chip-option (click)="filterEvents('failure')" [selected]="eventFilter === 'failure'">Failures</mat-chip-option>
              <mat-chip-option (click)="filterEvents('login')" [selected]="eventFilter === 'login'">Login</mat-chip-option>
              <mat-chip-option (click)="filterEvents('token')" [selected]="eventFilter === 'token'">Token</mat-chip-option>
            </mat-chip-listbox>
          </div>
          
          <div class="events-table-container">
            <table mat-table [dataSource]="filteredEvents" class="events-table">
              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let event">
                  <span class="event-type" [ngClass]="getTypeClass(event)">{{formatEventType(event.type)}}</span>
                </td>
              </ng-container>
              
              <!-- Username Column -->
              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let event">{{event.username || 'Anonymous'}}</td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let event">
                  <span class="status-chip" [ngClass]="event.success ? 'success' : 'failure'">
                    {{event.success ? 'Success' : 'Failed'}}
                  </span>
                </td>
              </ng-container>
              
              <!-- Time Column -->
              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let event">{{event.timestamp | date:'HH:mm:ss'}}</td>
              </ng-container>
              
              <!-- Action Column -->
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Details</th>
                <td mat-cell *matCellDef="let event">
                  <button mat-icon-button (click)="showEventDetails(event)">
                    <mat-icon>info</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .jwt-diagnostics-container {
      padding: 16px;
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    
    .connection-status.connected {
      background-color: #e6f4ea;
      color: #0d652d;
    }
    
    .connection-status.disconnected {
      background-color: #fce8e6;
      color: #c53929;
    }
    
    .connection-status mat-icon {
      margin-right: 8px;
    }
    
    .stats-card, .events-card {
      margin-bottom: 16px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .stat-item {
      padding: 16px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }
    
    .full-width {
      grid-column: span 4;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 500;
      margin-top: 8px;
    }
    
    .stat-value.success { color: #0d652d; }
    .stat-value.error { color: #c53929; }
    .stat-value.active { color: #1a73e8; }
    
    .events-filters {
      margin-bottom: 16px;
    }
    
    .events-table-container {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .events-table {
      width: 100%;
    }
    
    .event-type {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .event-type.login { background-color: #e8f0fe; color: #1967d2; }
    .event-type.token { background-color: #fef7e0; color: #b06000; }
    .event-type.logout { background-color: #e6f4ea; color: #0d652d; }
    
    .status-chip {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .status-chip.success { background-color: #e6f4ea; color: #0d652d; }
    .status-chip.failure { background-color: #fce8e6; color: #c53929; }
  `]
})
export class JwtDiagnosticsComponent implements OnInit, OnDestroy {
  // Authentication events
  events: AuthDiagnosticEvent[] = [];
  filteredEvents: AuthDiagnosticEvent[] = [];
  eventFilter: 'all' | 'success' | 'failure' | 'login' | 'token' = 'all';
  
  // Authentication stats
  stats: AuthStats = {
    totalAttempts: 0,
    successCount: 0,
    failCount: 0,
    lastActivity: '',
    activeTokens: 0,
    tokenVerifications: 0,
    failedVerifications: 0
  };
  
  // Table column configuration
  displayedColumns: string[] = ['type', 'username', 'status', 'time', 'action'];
  
  // Connection status
  connected = false;
  
  // Subscriptions to clean up
  private subscriptions = new Subscription();
  
  constructor(private jwtDiagnostics: JwtDiagnosticsServiceImpl) { }
  
  ngOnInit(): void {
    // Subscribe to auth events
    this.subscriptions.add(
      this.jwtDiagnostics.getAuthEvents().subscribe(events => {
        this.events = events;
        this.applyFilter();
      })
    );
    
    // Subscribe to auth stats
    this.subscriptions.add(
      this.jwtDiagnostics.getAuthStats().subscribe(stats => {
        this.stats = stats;
      })
    );
    
    // Subscribe to connection status
    this.subscriptions.add(
      this.jwtDiagnostics.getConnectionStatus().subscribe(status => {
        this.connected = status;
      })
    );
    
    // Get initial data
    this.jwtDiagnostics.getAuthEventsHttp().subscribe();
    this.jwtDiagnostics.getAuthStatsHttp().subscribe();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
  
  // Filter events based on selected filter
  filterEvents(filter: 'all' | 'success' | 'failure' | 'login' | 'token'): void {
    this.eventFilter = filter;
    this.applyFilter();
  }
  
  // Apply current filter to events
  private applyFilter(): void {
    switch (this.eventFilter) {
      case 'success':
        this.filteredEvents = this.events.filter(e => e.success);
        break;
      case 'failure':
        this.filteredEvents = this.events.filter(e => !e.success);
        break;
      case 'login':
        this.filteredEvents = this.events.filter(e => 
          e.type === 'login-success' || e.type === 'login-fail');
        break;
      case 'token':
        this.filteredEvents = this.events.filter(e => 
          e.type === 'token-validate-success' || e.type === 'token-validate-fail');
        break;
      default:
        this.filteredEvents = this.events;
    }
  }
  
  // Format event type for display
  formatEventType(type: string): string {
    switch (type) {
      case 'login-success': return 'Login';
      case 'login-fail': return 'Login';
      case 'token-validate-success': return 'Token';
      case 'token-validate-fail': return 'Token';
      case 'logout': return 'Logout';
      default: return type;
    }
  }
  
  // Get CSS class for event type
  getTypeClass(event: AuthDiagnosticEvent): string {
    if (event.type.startsWith('login')) return 'login';
    if (event.type.startsWith('token')) return 'token';
    return event.type;
  }
  
  // Show event details (placeholder - would open a dialog in real app)
  showEventDetails(event: AuthDiagnosticEvent): void {
    console.log('Event details:', event);
    alert(`Event ID: ${event.id}\nType: ${event.type}\nTimestamp: ${event.timestamp}${event.errorMessage ? '\nError: ' + event.errorMessage : ''}`);
  }
}

// Note: This component is a mock implementation and should be replaced with actual service calls and logic.