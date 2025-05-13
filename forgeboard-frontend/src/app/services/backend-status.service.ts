import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Use relative path for environment import
import { environment } from '../../environments/environment';

/**
 * Represents the status of a backend gateway service
 */
export interface GatewayStatus {
  name: string;
  connected: boolean;
  usingMockData: boolean;
}

/**
 * Summary of all backend services status
 */
export interface BackendStatusSummary {
  gateways: GatewayStatus[];
  allConnected: boolean;
  anyMockData: boolean;
}

// Define an interface for the gateway status state
interface GatewayState {
  connected: boolean;
  mockActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BackendStatusService {
  // Track status of all gateways
  private gatewayStatusSubjects = new Map<string, BehaviorSubject<GatewayState>>();
  
  // Status summary subject for the entire backend
  private statusSummarySubject = new BehaviorSubject<BackendStatusSummary>({
    gateways: [],
    allConnected: false,
    anyMockData: false
  });

  private statusSubject = new BehaviorSubject<boolean>(false);
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private statusUrl = `${environment.apiBaseUrl}/status`;

  constructor(private http: HttpClient) {
    // Initialize default statuses for known gateways
    this.initGateway('kanban');
    this.initGateway('metrics');
    this.initGateway('diagnostics');
    this.initGateway('logger');

    // Start checking backend status
    this.startStatusChecking();
  }

  /**
   * Initialize a gateway with default status values
   * @private
   */
  private initGateway(name: string): void {
    this.registerGateway(name);
  }

  /**
   * Register a new gateway with default status values
   */
  registerGateway(name: string): void {
    if (!this.gatewayStatusSubjects.has(name)) {
      this.gatewayStatusSubjects.set(name, new BehaviorSubject<GatewayState>({
        connected: false,
        mockActive: false
      }));
      this.updateStatusSummary();
    }
  }

  /**
   * Update the status of a specific gateway
   */
  updateGatewayStatus(name: string, connected: boolean, usingMockData: boolean): void {
    if (!this.gatewayStatusSubjects.has(name)) {
      this.registerGateway(name);
    }
    
    this.gatewayStatusSubjects.get(name)?.next({
      connected,
      mockActive: usingMockData
    });
    
    this.updateStatusSummary();
  }

  /**
   * Update the status summary based on all gateway statuses
   * @private
   */
  private updateStatusSummary(): void {
    const gateways: GatewayStatus[] = [];
    let allConnected = true;
    let anyMockData = false;
    
    this.gatewayStatusSubjects.forEach((subject, name) => {
      const status = subject.getValue();
      gateways.push({
        name,
        connected: status.connected,
        usingMockData: status.mockActive
      });
      
      if (!status.connected) {
        allConnected = false;
      }
      
      if (status.mockActive) {
        anyMockData = true;
      }
    });
    
    this.statusSummarySubject.next({
      gateways,
      allConnected,
      anyMockData
    });
  }

  // Start periodic status checking
  startStatusChecking(intervalMs: number = 10000): void {
    // Check immediately
    this.checkBackendStatus();
    
    // Clear any existing interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    // Set up periodic checking
    this.statusCheckInterval = setInterval(() => {
      this.checkBackendStatus();
    }, intervalMs);
  }

  // Stop periodic status checking
  stopStatusChecking(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  // Check backend status
  private checkBackendStatus(): void {
    this.http.get<{status: string}>(this.statusUrl)
      .pipe(
        map(response => response?.status === 'ok'),
        catchError(() => of(false)),
        tap(isOnline => {
          if (this.statusSubject.value !== isOnline) {
            console.log(`Backend status changed: ${isOnline ? 'online' : 'offline'}`);
            this.statusSubject.next(isOnline);
          }
        })
      )
      .subscribe();
  }

  /**
   * Returns an observable of the backend status summary.
   */
  public getStatusSummary(): Observable<BackendStatusSummary> {
    return this.statusSummarySubject.asObservable();
  }

  /**
   * Get status as observable
   * Returns boolean indicating if backend is online
   */
  getStatus(): Observable<boolean> {
    return this.statusSubject.asObservable();
  }

  /**
   * Force a reconnection attempt for all services
   */
  forceReconnectionCheck(): void {
    console.log('Triggering backend reconnection check');
    // Dispatch a custom event that services can listen for
    const event = new CustomEvent('backend-available');
    window.dispatchEvent(event);
  }
}
