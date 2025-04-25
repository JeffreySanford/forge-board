# ForgeBoard Coding Standards

This document outlines the coding standards and best practices for the ForgeBoard project.

## Angular Best Practices

### Component Architecture

1. **Smart & Presentational Components**
   - Smart components handle data and logic
   - Presentational components focus on UI rendering
   - Example:

   ```typescript
   // Smart Component (container)
   @Component({
     selector: 'app-metrics-container',
     template: '<app-metrics-display [data]="metrics$ | async" (intervalChange)="updateInterval($event)"></app-metrics-display>'
   })
   export class MetricsContainerComponent {
     metrics$: Observable<MetricData>;
     
     constructor(private metricsService: MetricsService) {
       this.metrics$ = this.metricsService.getMetricsStream();
     }
     
     updateInterval(interval: number): void {
       this.metricsService.setMetricsInterval(interval).subscribe();
     }
   }

   // Presentational Component
   @Component({
     selector: 'app-metrics-display',
     templateUrl: './metrics-display.component.html'
   })
   export class MetricsDisplayComponent {
     @Input() data: MetricData;
     @Output() intervalChange = new EventEmitter<number>();
   }
   ```

2. **Component Lifecycle Management**
   - Always implement `OnDestroy` for cleanup
   - Use the appropriate lifecycle hooks
   - Example:

   ```typescript
   @Component({/* ... */})
   export class ExampleComponent implements OnInit, OnDestroy {
     private subscription = new Subscription();
     
     ngOnInit(): void {
       this.subscription.add(
         this.someService.getData().subscribe(data => {
           // Handle data
         })
       );
     }
     
     ngOnDestroy(): void {
       this.subscription.unsubscribe();
     }
   }
   ```

### Service Design

1. **Single Responsibility Principle**
   - Each service should have a clear, focused purpose
   - Break down complex services into smaller ones

2. **Injectable Services**
   - Always use the `@Injectable()` decorator
   - Provide services at the appropriate level

   ```typescript
   @Injectable({
     providedIn: 'root' // Application-wide singleton
   })
   export class CoreService { /* ... */ }

   @Injectable() // Component-specific instance
   export class FeatureService { /* ... */ }
   ```

3. **Service State Management**
   - Use RxJS subjects to maintain service state
   - Expose state as observables for components

   ```typescript
   @Injectable({
     providedIn: 'root'
   })
   export class DataService {
     private dataSubject = new BehaviorSubject<Data[]>([]);
     
     getData(): Observable<Data[]> {
       return this.dataSubject.asObservable();
     }
     
     updateData(newData: Data[]): void {
       this.dataSubject.next(newData);
     }
   }
   ```

## WebSockets & Real-Time

### Service Pattern - Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  @Injectable() MetricsService                                   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐   │
│  │             │  │             │  │                       │   │
│  │ Socket.IO   │──▶ Subject/    │──▶ Public Observable     │   │
│  │ Connection  │  │ BehaviorSubj│  │ interface getMetrics()│   │
│  │             │  │             │  │                       │   │
│  └─────────────┘  └─────────────┘  └───────────────────────┘   │
│        │                                      │                │
│        │                                      │                │
│        ▼                                      │                │
│  ┌─────────────────────┐                      │                │
│  │                     │                      │                │
│  │ Error Handler with  │                      │                │
│  │ Mock Data Fallback  │                      │                │
│  │                     │                      │                │
│  └─────────────────────┘                      │                │
│                                               │                │
└───────────────────────────────────────────────┼────────────────┘
                                                │
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  @Component() MetricsComponent                                  │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │                     │  │             │  │                  │ │
│  │ ngOnInit():         │──▶ Subscribe   │──▶ Update UI State  │ │
│  │ metrics$.subscribe()│  │ to Stream   │  │ this.chartData   │ │
│  │                     │  │             │  │                  │ │
│  └─────────────────────┘  └─────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │ ngOnDestroy(): this.subscription.unsubscribe()          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Socket Connection Pattern

Services that use WebSockets should follow this pattern:

```typescript
@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private dataSubject = new Subject<DataType>();
  
  constructor() {
    this.initSocket();
  }
  
  ngOnDestroy(): void {
    this.cleanupSocket();
    this.connectionStatusSubject.complete();
    this.dataSubject.complete();
  }
  
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  getData(): Observable<DataType> {
    return this.dataSubject.asObservable();
  }
  
  private initSocket(): void {
    // Initialize socket with proper error handling
  }
  
  private cleanupSocket(): void {
    if (this.socket) {
      // Remove all listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('data-event');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
  }
}
```

### Mock Data Strategy

When backend is unavailable, implement mock data generation:

```typescript
private startMockDataGeneration(): void {
  if (this.mockDataInterval) return;
  
  this.mockDataInterval = setInterval(() => {
    const mockData: DataType = {
      value: Math.random() * 100,
      timestamp: new Date().toISOString()
    };
    this.dataSubject.next(mockData);
  }, this.updateInterval);
  
  this.backendStatusService.updateGatewayStatus('serviceName', false, true);
}

private stopMockDataGeneration(): void {
  if (this.mockDataInterval) {
    clearInterval(this.mockDataInterval);
    this.mockDataInterval = null;
    
    this.backendStatusService.updateGatewayStatus('serviceName', true, false);
  }
}
```

### Socket Reconnection Pattern

All socket-enabled services should implement a robust reconnection pattern:

```typescript
// Add reconnection properties
private reconnecting = false;
private backendAvailableListener: () => void;

constructor() {
  // Listen for backend availability to reconnect
  this.backendAvailableListener = () => {
    if (this.mockDataActive && !this.reconnecting) {
      this.reconnectToBackend();
    }
  };
  
  window.addEventListener('backend-available', this.backendAvailableListener);
}

ngOnDestroy(): void {
  // Remove event listener
  window.removeEventListener('backend-available', this.backendAvailableListener);
  // ... other cleanup
}

private reconnectToBackend(): void {
  if (this.reconnecting) return;
  this.reconnecting = true;
  
  // Validate backend is truly available with direct health check
  this.http.get(`${this.apiUrl}/status`)
    .pipe(catchError(() => of({ status: 'error' })))
    .subscribe(response => {
      if (response?.status !== 'error') {
        // Clean up existing socket connection
        this.cleanupSocket();
        
        // Create new socket with proper error handling
        this.initSocket();
        
        // Stop mock data when real data is flowing
        this.stopMockDataGeneration();
        
        // Update status via BackendStatusService
        this.backendStatusService.updateGatewayStatus('serviceName', true, false);
      }
      
      // Reset reconnection flag after delay
      setTimeout(() => {
        this.reconnecting = false;
      }, 5000);
    });
}
```

## RxJS Guidelines

### Subscription Management

1. **Always clean up subscriptions**:
   ```typescript
   private subscription = new Subscription();
   
   ngOnInit(): void {
     this.subscription.add(
       this.service.getData().subscribe(/* ... */)
     );
     this.subscription.add(
       this.otherService.getStatus().subscribe(/* ... */)
     );
   }
   
   ngOnDestroy(): void {
     this.subscription.unsubscribe();
   }
   ```

2. **Use the `takeUntil` pattern for multiple subscriptions**:
   ```typescript
   private destroy$ = new Subject<void>();
   
   ngOnInit(): void {
     this.service.getData().pipe(
       takeUntil(this.destroy$)
     ).subscribe(/* ... */);
     
     this.otherService.getStatus().pipe(
       takeUntil(this.destroy$)
     ).subscribe(/* ... */);
   }
   
   ngOnDestroy(): void {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

### Error Handling

Use proper error handling in RxJS streams:

```typescript
this.http.get<DataType>('/api/data').pipe(
  retry(3),
  catchError(error => {
    console.error('Error fetching data:', error);
    return of(fallbackData);
  }),
  finalize(() => {
    this.loading = false;
  })
).subscribe({
  next: data => this.handleData(data),
  error: err => this.handleError(err)
});
```

## CSS/SCSS Standards

1. **BEM-inspired naming**:
   ```scss
   .kablan-board {
     // Block
     
     &__column {
       // Element
     }
     
     &--active {
       // Modifier
     }
   }
   ```

2. **Consistent color variables**:
   ```scss
   $color-primary: #3498db;
   $color-success: #4eff91;
   $color-warning: #ffe066;
   $color-error: #e74c3c;
   ```

3. **Mobile-first responsive design**:
   ```scss
   .container {
     width: 100%;
     
     @media (min-width: 768px) {
       width: 750px;
     }
     
     @media (min-width: 992px) {
       width: 970px;
     }
   }
   ```

## Testing Guidelines

1. **Component Tests**:
   ```typescript
   describe('AppComponent', () => {
     let component: AppComponent;
     let fixture: ComponentFixture<AppComponent>;
     
     beforeEach(async () => {
       await TestBed.configureTestingModule({
         declarations: [AppComponent],
         providers: [
           { provide: MetricsService, useValue: mockMetricsService }
         ]
       }).compileComponents();
       
       fixture = TestBed.createComponent(AppComponent);
       component = fixture.componentInstance;
     });
     
     it('should create the component', () => {
       expect(component).toBeTruthy();
     });
     
     it('should show metrics data', () => {
       component.metrics = mockMetrics;
       fixture.detectChanges();
       const compiled = fixture.nativeElement;
       expect(compiled.querySelector('.metric-value').textContent).toContain('50%');
     });
   });
   ```

2. **Service Tests**:
   ```typescript
   describe('MetricsService', () => {
     let service: MetricsService;
     let httpMock: HttpTestingController;
     
     beforeEach(() => {
       TestBed.configureTestingModule({
         imports: [HttpClientTestingModule],
         providers: [MetricsService]
       });
       
       service = TestBed.inject(MetricsService);
       httpMock = TestBed.inject(HttpTestingController);
     });
     
     it('should fetch metrics', () => {
       const mockMetrics = { cpu: 50, memory: 60, time: '2023-01-01T00:00:00Z' };
       
       service.getMetrics().subscribe(metrics => {
         expect(metrics).toEqual(mockMetrics);
       });
       
       const req = httpMock.expectOne('/api/metrics');
       expect(req.request.method).toBe('GET');
       req.flush(mockMetrics);
     });
   });
   ```

## Documentation Standards

1. **Component and Service Documentation**:
   ```typescript
   /**
    * Metrics service responsible for managing real-time system metrics.
    * 
    * Features:
    * - Real-time metric updates via WebSockets
    * - Automatic reconnection with backoff strategy
    * - Fallback to mock data generation when backend is unavailable
    */
   @Injectable({
     providedIn: 'root'
   })
   export class MetricsService {
     /**
      * Subscribe to the metrics stream
      * @returns Observable that emits MetricData
      */
     getMetricsStream(): Observable<MetricData> {
       // Implementation...
     }
   }
   ```

2. **Interface Documentation**:
   ```typescript
   /**
    * System metric data structure
    */
   export interface MetricData {
     /** CPU usage percentage (0-100) */
     cpu: number;
     
     /** Memory usage percentage (0-100) */
     memory: number;
     
     /** ISO timestamp of the metric reading */
     time: string;
     
     /** Optional disk usage percentage (0-100) */
     disk?: number;
     
     /** Optional network usage percentage (0-100) */
     network?: number;
   }
   ```

## Git Workflow

1. **Branch naming conventions**:
   - `feature/short-feature-description`
   - `bugfix/issue-description`
   - `chore/maintenance-task`

2. **Commit message format**:
   ```
   type(scope): Short summary

   Detailed explanation if needed
   ```

   Where `type` is one of:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - style: Formatting changes
   - refactor: Code refactoring
   - test: Adding or updating tests
   - chore: Maintenance tasks
