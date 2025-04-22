import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { timer, Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, take, catchError, finalize } from 'rxjs/operators';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
  error?: string;
}

interface ErrorDetails {
  code: number;
  message: string;
  path: string;
  timestamp: string;
}

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  standalone: false
})
export class NotFoundComponent implements OnInit {
  countdown$: Observable<number>;
  readonly countdownSeconds = 15;
  
  errorCode = '404';
  errorDetails: ErrorDetails = {
    code: 404,
    message: 'Page Not Found',
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  endpoints: EndpointStatus[] = [
    { name: 'Authentication API', url: 'http://localhost:3000/api/auth/status', status: 'checking' },
    { name: 'Metrics API', url: 'http://localhost:3000/api/metrics/status', status: 'checking' },
    { name: 'User API', url: 'http://localhost:3000/api/users/status', status: 'checking' },
    { name: 'WebSocket Server', url: 'http://localhost:3000/api/socket-health', status: 'checking' },
    { name: 'Static Assets', url: 'http://localhost:4200/assets/images/logo.png', status: 'checking' }
  ];

  checkingStatus = true;
  overallStatus: 'online' | 'partial' | 'offline' | 'checking' = 'checking';
  refreshTrigger = new BehaviorSubject<void>(undefined);

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    // Initialize countdown timer
    this.countdown$ = timer(0, 1000).pipe(
      map(i => this.countdownSeconds - i),
      take(this.countdownSeconds + 1)
    );
    
    // Check if we were passed error details
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.errorCode = params['code'];
        this.errorDetails = {
          code: parseInt(params['code'], 10) || 404,
          message: params['message'] || 'Page Not Found',
          path: params['path'] || window.location.pathname,
          timestamp: params['timestamp'] || new Date().toISOString()
        };
      }
    });
  }

  ngOnInit(): void {
    // Auto-navigate to home after countdown
    this.countdown$.subscribe({
      complete: () => this.router.navigate(['/home'])
    });
    
    // Check service health
    this.checkServiceStatus();
  }

  checkServiceStatus(): void {
    this.checkingStatus = true;
    this.overallStatus = 'checking';
    
    // Reset all endpoints to checking status
    this.endpoints.forEach(endpoint => {
      endpoint.status = 'checking';
      endpoint.latency = undefined;
      endpoint.error = undefined;
    });

    // Create observables for each endpoint check
    const checks = this.endpoints.map((endpoint, index) => {
      const startTime = Date.now();
      return this.http.get(endpoint.url, { observe: 'response' }).pipe(
        map(() => {
          const latency = Date.now() - startTime;
          return {
            index,
            status: 'online' as const,
            latency,
            error: undefined
          };
        }),
        catchError(error => {
          return of({
            index,
            status: 'offline' as const,
            latency: Date.now() - startTime,
            error: error.message || 'Unknown error'
          });
        })
      );
    });

    // Run all checks in parallel
    forkJoin(checks).pipe(
      finalize(() => {
        this.checkingStatus = false;
        
        // Determine overall status
        const onlineCount = this.endpoints.filter(e => e.status === 'online').length;
        if (onlineCount === this.endpoints.length) {
          this.overallStatus = 'online';
        } else if (onlineCount === 0) {
          this.overallStatus = 'offline';
        } else {
          this.overallStatus = 'partial';
        }
      })
    ).subscribe(results => {
      // Update endpoint statuses with results
      results.forEach(result => {
        this.endpoints[result.index].status = result.status;
        this.endpoints[result.index].latency = result.latency;
        this.endpoints[result.index].error = result.error;
      });
    });
  }

  refreshStatus(): void {
    this.checkServiceStatus();
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  getStatusColor(status: 'online' | 'offline' | 'checking'): string {
    switch (status) {
      case 'online': return '#4eff91'; // Green
      case 'offline': return '#e74c3c'; // Red
      case 'checking': return '#ffe066'; // Yellow
      default: return '#ffffff'; // White
    }
  }

  getOverallStatusColor(): string {
    switch (this.overallStatus) {
      case 'online': return '#4eff91'; // Green
      case 'offline': return '#e74c3c'; // Red
      case 'partial': return '#ffe066'; // Yellow
      case 'checking': return '#ffe066'; // Yellow
      default: return '#ffffff'; // White
    }
  }

  getOverallStatusText(): string {
    switch (this.overallStatus) {
      case 'online': return 'ALL SYSTEMS OPERATIONAL';
      case 'offline': return 'COMPLETE SYSTEM OUTAGE';
      case 'partial': return 'PARTIAL SYSTEM OUTAGE';
      case 'checking': return 'CHECKING SYSTEM STATUS';
      default: return 'UNKNOWN STATUS';
    }
  }
}
