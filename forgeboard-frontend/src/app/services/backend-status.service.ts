import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GatewayStatus {
  connected: boolean;
  mockActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BackendStatusService {
  private gatewayStatusSubjects = new Map<string, BehaviorSubject<GatewayStatus>>();

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
      this.gatewayStatusSubjects.set(name, new BehaviorSubject<GatewayStatus>({
        connected: false,
        mockActive: false
      }));
    }
  }

  /**
   * Update the status of a gateway
   */
  updateGatewayStatus(name: string, connected: boolean, mockActive: boolean): void {
    if (!this.gatewayStatusSubjects.has(name)) {
      this.registerGateway(name);
    }
    
    const subject = this.gatewayStatusSubjects.get(name);
    if (subject) {
      subject.next({ connected, mockActive });
    }
  }

  /**
   * Get an observable of the status for a specific gateway
   */
  getGatewayStatus(name: string): Observable<GatewayStatus> {
    if (!this.gatewayStatusSubjects.has(name)) {
      this.registerGateway(name);
    }
    
    // Using null assertion operator is safe here since we just registered the gateway if it didn't exist
    const subject = this.gatewayStatusSubjects.get(name);
    if (!subject) {
      throw new Error(`Gateway ${name} not found even after registration attempt`);
    }
    return subject.asObservable();
  }

  /**
   * Check if any gateway is using mock data
   */
  getAnyMockDataStatus(): Observable<boolean> {
    const subject = new BehaviorSubject<boolean>(false);
    
    // Update subject whenever any gateway status changes
    this.gatewayStatusSubjects.forEach((statusSubject) => {
      statusSubject.subscribe(() => {
        let anyMockActive = false;
        
        this.gatewayStatusSubjects.forEach(sub => {
          if (sub.value.mockActive) {
            anyMockActive = true;
          }
        });
        
        subject.next(anyMockActive);
      });
    });
    
    return subject.asObservable();
  }
}
