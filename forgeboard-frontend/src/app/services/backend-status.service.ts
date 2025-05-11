import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  constructor() {
    // Initialize default statuses for known gateways
    this.initGateway('kablan');
    this.initGateway('metrics');
    this.initGateway('diagnostics');
    this.initGateway('logger');
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

  /**
   * Returns an observable of the backend status summary.
   */
  public getStatusSummary(): Observable<BackendStatusSummary> {
    return this.statusSummarySubject.asObservable();
  }

  /**
   * Get the status summary observable
   */
  getStatus(): Observable<BackendStatusSummary> {
    return this.statusSummarySubject.asObservable();
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
