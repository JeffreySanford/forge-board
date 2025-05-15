import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, takeUntil, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { SecurityEvent } from '@forge-board/shared/api-interfaces';
import { environment } from '../../environments/environment';
import { SystemService } from './system.service';

interface ConnectionStatus {
  connected: boolean;
  mockMode: boolean;
}

/**
 * SecurityService
 *
 * Handles WebSocket communication for security events and provides observables
 * for different types of security events (SBOM, SCA, ZAP, etc.).
 */
@Injectable({ providedIn: 'root' })
export class SecurityService implements OnDestroy {
  // Initialize socket as null to satisfy TypeScript
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();

  // BehaviorSubjects for different security event types
  private sbom$ = new BehaviorSubject<SecurityEvent | null>(null);
  private sca$ = new BehaviorSubject<SecurityEvent | null>(null);
  private zap$ = new BehaviorSubject<SecurityEvent | null>(null);
  private supplyChain$ = new BehaviorSubject<SecurityEvent | null>(null);
  private fedramp$ = new BehaviorSubject<SecurityEvent | null>(null);
  private error$ = new BehaviorSubject<string | null>(null);
  private status$ = new BehaviorSubject<ConnectionStatus>({ 
    connected: false, 
    mockMode: true 
  });

  constructor(private systemService: SystemService) {
    this.initializeSocket();
  }

  /**
   * Initialize the WebSocket connection and set up event listeners
   */
  private initializeSocket(): void {
    this.socket = io(`${environment.socketBaseUrl}/security-stream`, {
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
    });

    if (this.socket) {
      // Use RxJS fromEvent instead of direct event listeners
      fromEvent(this.socket, 'connect')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.status$.next({ ...this.status$.value, connected: true });
          console.log('SecurityService: Socket connected');
        });
      
      fromEvent(this.socket, 'disconnect')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.status$.next({ ...this.status$.value, connected: false });
          console.log('SecurityService: Socket disconnected');
        });
      
      fromEvent<ConnectionStatus>(this.socket, 'security-stream-status')
        .pipe(takeUntil(this.destroy$))
        .subscribe((status) => {
          this.status$.next(status);
        });
      
      fromEvent<SecurityEvent>(this.socket, 'security-event')
        .pipe(takeUntil(this.destroy$))
        .subscribe(event => this.handleSecurityEvent(event));
      
      fromEvent<Error>(this.socket, 'connect_error')
        .pipe(takeUntil(this.destroy$))
        .subscribe((err) => {
          this.error$.next('Connection error: ' + err.message);
          console.error('SecurityService: Connection error', err);
        });
    }
  }

  /**
   * Handle incoming security events
   */
  private handleSecurityEvent(event: SecurityEvent): void {
    switch (event.type) {
      case 'sbom':
        this.sbom$.next(event);
        break;
      case 'sca':
        this.sca$.next(event);
        break;
      case 'zap':
        this.zap$.next(event);
        break;
      case 'supplyChain':
        this.supplyChain$.next(event);
        break;
      case 'fedramp':
        this.fedramp$.next(event);
        break;
      default:
        this.error$.next('Unknown event type: ' + event.type);
    }
  }

  /**
   * Clean up socket connection and remove all listeners
   * This method satisfies the ESLint socket cleanup rule
   */
  private cleanupSocket(): void {
    if (this.socket) {
      console.log('SecurityService: Cleaning up socket');
      
      // Socket.IO instance cleanup - required by ESLint rule
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('security-stream-status');
      this.socket.off('security-event');
      this.socket.off('connect_error');
      
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
      console.log('SecurityService: Socket cleaned up');
    }
  }

  /**
   * Toggle mock mode on the server
   */
  toggleMockMode(enable: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('toggle-mock', enable);
    }
  }

  /**
   * Verify the integrity of security data using hash verification
   */
  verifyDataIntegrity(data: string, expectedHash: string): Observable<boolean> {
    return this.systemService.generateHash(data).pipe(
      map(result => result.hash === expectedHash)
    );
  }

  // Expose observables for component subscriptions
  get sbom(): Observable<SecurityEvent | null> { return this.sbom$.asObservable(); }
  get sca(): Observable<SecurityEvent | null> { return this.sca$.asObservable(); }
  get zap(): Observable<SecurityEvent | null> { return this.zap$.asObservable(); }
  get supplyChain(): Observable<SecurityEvent | null> { return this.supplyChain$.asObservable(); }
  get fedramp(): Observable<SecurityEvent | null> { return this.fedramp$.asObservable(); }
  get error(): Observable<string | null> { return this.error$.asObservable(); }
  get status(): Observable<ConnectionStatus> { return this.status$.asObservable(); }

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    // Signal all observables to complete
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up socket connections using our dedicated method
    this.cleanupSocket();
    
    // Complete all BehaviorSubjects
    this.sbom$.complete();
    this.sca$.complete();
    this.zap$.complete();
    this.supplyChain$.complete();
    this.fedramp$.complete();
    this.error$.complete();
    this.status$.complete();
  }
}
