import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

export interface GatewayStatus {
  name: string;
  connected: boolean;
  usingMockData: boolean;
  lastConnected: Date | null;
  failedAttempts: number;
}

export interface BackendStatusSummary {
  allConnected: boolean;
  anyMockData: boolean;
  gateways: GatewayStatus[];
  lastStatusChange: Date;
}

/**
 * Service to track backend connection status and coordinate reconnection attempts
 * across multiple gateways (metrics, diagnostics, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class BackendStatusService {
  private gateways: Record<string, GatewayStatus> = {};
  private statusSubject = new BehaviorSubject<BackendStatusSummary>(this.getInitialStatus());
  private apiUrl = 'http://localhost:3000/api';
  private reconnectionAttemptInProgress = false;
  private lastReconnectionAttempt: Date | null = null;
  private reconnectionMinInterval = 5000; // Min 5s between reconnection attempts
  
  constructor(private http: HttpClient) {
    // Register known gateways
    this.registerGateway('metrics');
    this.registerGateway('diagnostics');
    
    // Setup reconnection check every 5 seconds
    timer(5000, 5000).subscribe(() => this.checkBackendAvailability());
    
    // Log status changes
    this.statusSubject.subscribe(status => {
      console.log(`[BackendStatus] Status update: All connected=${status.allConnected}, Using mock=${status.anyMockData}, Gateways=${status.gateways.length}`);
      status.gateways.forEach(g => {
        console.log(`[BackendStatus] Gateway ${g.name}: connected=${g.connected}, mock=${g.usingMockData}`);
      });
    });
  }

  /**
   * Register a new gateway to track
   */
  registerGateway(name: string): void {
    if (!this.gateways[name]) {
      this.gateways[name] = {
        name,
        connected: false,
        usingMockData: false,
        lastConnected: null,
        failedAttempts: 0
      };
      this.updateStatus();
    }
  }

  /**
   * Update a gateway's connection status
   */
  updateGatewayStatus(name: string, connected: boolean, usingMockData = false): void {
    if (!this.gateways[name]) {
      this.registerGateway(name);
    }

    const gateway = this.gateways[name];
    const statusChanged = gateway.connected !== connected || gateway.usingMockData !== usingMockData;
    
    gateway.connected = connected;
    gateway.usingMockData = usingMockData;
    
    if (connected) {
      gateway.lastConnected = new Date();
      gateway.failedAttempts = 0;
    } else if (!usingMockData) {
      // Only increment failures if we're not deliberately using mock data
      gateway.failedAttempts++;
    }
    
    if (statusChanged) {
      console.log(`[BackendStatus] Gateway ${name} status changed: connected=${connected}, using mock=${usingMockData}`);
      this.updateStatus();
    }
  }

  /**
   * Get the current backend status as an observable
   */
  getStatus(): Observable<BackendStatusSummary> {
    return this.statusSubject.asObservable();
  }

  /**
   * Get status for a specific gateway
   */
  getGatewayStatus(name: string): GatewayStatus | undefined {
    return this.gateways[name];
  }

  /**
   * Update the overall status based on all gateways
   */
  private updateStatus(): void {
    const gatewayList = Object.values(this.gateways);
    
    const summary: BackendStatusSummary = {
      allConnected: gatewayList.every(g => g.connected),
      anyMockData: gatewayList.some(g => g.usingMockData),
      gateways: [...gatewayList],
      lastStatusChange: new Date()
    };
    
    this.statusSubject.next(summary);
  }

  /**
   * Get initial status object
   */
  private getInitialStatus(): BackendStatusSummary {
    return {
      allConnected: false,
      anyMockData: false,
      gateways: [],
      lastStatusChange: new Date()
    };
  }
  
  /**
   * Check if backend is available and trigger reconnection
   * This helps when the server comes back online after being down
   */
  private checkBackendAvailability(): void {
    if (this.reconnectionAttemptInProgress) return;
    
    // Only check if we're using mock data
    const anyMockData = Object.values(this.gateways).some(g => g.usingMockData);
    if (!anyMockData) return;
    
    this.reconnectionAttemptInProgress = true;
    
    // Simple health check endpoint with proper type definition
    this.http.get<{status: string}>(`${this.apiUrl}/status`)
      .pipe(
        tap(() => {
          console.log('[BackendStatus] Backend health check successful, triggering reconnection');
          // If successful, this means the server is back online
          // Signal services to try reconnecting
          this.triggerReconnection();
        }),
        catchError(err => {
          console.log('[BackendStatus] Backend still unavailable:', err.message);
          this.reconnectionAttemptInProgress = false;
          throw err;
        })
      )
      .subscribe({
        error: () => {
          this.reconnectionAttemptInProgress = false;
        },
        complete: () => {
          this.reconnectionAttemptInProgress = false;
        }
      });
  }
  
  /**
   * Force a reconnection check immediately
   * Can be called by components when user explicitly requests reconnection
   */
  forceReconnectionCheck(): void {
    console.log('[BackendStatus] Forcing reconnection check');
    this.reconnectionAttemptInProgress = false;
    this.lastReconnectionAttempt = null;
    this.checkBackendAvailability();
  }
  
  /**
   * Trigger reconnection attempt for all services
   */
  private triggerReconnection(): void {
    // Fire an event that the server is available again
    const event = new CustomEvent('backend-available', { 
      detail: { timestamp: new Date() } 
    });
    console.log('[BackendStatus] Dispatching backend-available event');
    window.dispatchEvent(event);
    
    // Update any mocked gateways to try reconnection
    Object.keys(this.gateways).forEach(name => {
      const gateway = this.gateways[name];
      if (gateway.usingMockData) {
        console.log(`[BackendStatus] Triggering reconnection for ${name}`);
        // We don't update status here - let the services do that when they reconnect
      }
    });
  }
}
