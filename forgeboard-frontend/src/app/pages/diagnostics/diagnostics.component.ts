import { Component, OnInit, OnDestroy } from '@angular/core';
import { DiagnosticsService } from './diagnostics.service';
import { Subscription, Observable } from 'rxjs';
import { SocketResponse } from '@forge-board/shared/api-interfaces';

// Define proper interfaces for component properties
interface HealthDetails {
  past: string;
  present: string;
  future: string;
  [key: string]: string;
}

interface Health {
  status: string;
  uptime: number;
  details: HealthDetails;
}

interface MetricData {
  cpu: number;
  memory: number;
  time: string;
}

@Component({
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrls: ['./diagnostics.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class DiagnosticsComponent implements OnInit, OnDestroy {
  // Add missing properties referenced in the template
  services: string[] = [];
  controllers: string[] = [];
  gateways: string[] = [];
  health: Health = {
    status: 'Unknown',
    uptime: 0,
    details: {
      past: 'Unknown',
      present: 'Unknown',
      future: 'Unknown'
    }
  };
  
  // Add error tracking
  errors: string[] = [];
  
  // Add metrics$ observable
  metrics$: Observable<SocketResponse<MetricData>>;
  
  // Add socket status
  socketStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  
  // Change from private to public
  public socketEvents: Subscription = new Subscription();
  private subscriptions = new Subscription();
  private connectionStatusSubscription: Subscription | null = null;

  constructor(private diagnosticsService: DiagnosticsService) {
    // Initialize metrics$ observable
    this.metrics$ = this.diagnosticsService.getMetricsUpdates();
  }

  ngOnInit(): void {
    // Fetch services, controllers, and gateways
    this.loadServices();
    this.loadHealth();
    
    // Set up socket connection for real-time updates
    this.socketEvents = new Subscription();
    this.socketEvents.add(
      this.diagnosticsService.healthUpdates().subscribe({
        next: health => {
          this.health = health;
        },
        error: err => {
          this.errors.push(`Health update error: ${err.message}`);
          this.socketStatus = 'error';
        }
      })
    );

    // Track socket connection status
    this.connectionStatusSubscription = this.diagnosticsService.connectionStatus().subscribe(status => {
      this.socketStatus = status;
    });
    // Add to socketEvents to ensure it's cleaned up
    if (this.connectionStatusSubscription) {
      this.socketEvents.add(this.connectionStatusSubscription);
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    
    // Clean up socket connection
    if (this.socketStatus) {
      this.socketStatus.disconnect();
      this.socketStatus = null;
    }
  }

  loadServices(): void {
    this.subscriptions.add(
      this.diagnosticsService.getServicesAndControllers().subscribe(data => {
        this.services = data.services || [];
        this.controllers = data.controllers || [];
        this.gateways = data.gateways || [];
      })
    );
  }

  loadHealth(): void {
    this.subscriptions.add(
      this.diagnosticsService.getHealth().subscribe(health => {
        this.health = health;
      })
    );
  }

  registerEvent(): void {
    this.diagnosticsService.registerEvent('diagnostics-page-view').subscribe();
  }
}
