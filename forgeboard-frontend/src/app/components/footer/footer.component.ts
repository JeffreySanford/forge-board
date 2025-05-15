import { Component, ViewChild, ElementRef, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { UserData } from '../../services/user-data.service';
import { BackendStatusService, BackendStatusSummary } from '../../services/backend-status.service';
import { DiagnosticsService, EnhancedHealthData } from '../../services/diagnostics.service';
import { Subscription, interval } from 'rxjs';

// Define interfaces for navigator connection and performance memory
interface NavigatorConnection {
  downlink: number;
  effectiveType: string;
  rtt: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

interface CalloutLine {
  key: string;
  value: string;
  keyDelay: number;
  keyCharDelay: number;
  valDelay: number;
  valCharDelay: number;
  dingVolume?: number;
}

// Add proper interfaces for database health data
interface DBConnection {
  active: number;
  status: string;
}

interface DBPerformance {
  avgQueryTime: number;
  status: string;
}

interface DBStorage {
  used: number;
  status: string;
}

// Use this interface in the updateDatabaseStatus method to remove the unused variable warning
interface DatabaseHealth {
  status: 'up' | 'down' | 'degraded' | 'error' | 'warning';
  connections: DBConnection;
  performance: DBPerformance;
  storage: DBStorage;
  message?: string; // Added message field to match usage in the code
}

interface StatusMetric {
  name: string;
  value: string | number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'; // Added 'unknown' to the valid status types
}

interface SystemStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'offline';
  lastUpdated: Date;
  icon: string;
  animationClass?: string;
  message?: string;
  metrics: StatusMetric[];
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {
  @Input() showContextBlock = true;
  @Input() showLayoutBorder = true;
  @Input() animationsStarted = false;
  @Input() audioEnabled = false;
  @Input() userData: UserData | null = null;

  @Output() iconsCollapseToggle = new EventEmitter<boolean>();
  @Output() gridToggle = new EventEmitter<void>();
  @Output() infoClick = new EventEmitter<void>();
  @Output() databaseClick = new EventEmitter<void>();
  @Output() audioToggle = new EventEmitter<boolean>();

  @ViewChild('keyStrikeSound') keyStrikeSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('dingSound') dingSound!: ElementRef<HTMLAudioElement>;

  activeCursor = { field: -1, value: -1 };
  calloutLines: CalloutLine[] = [];
  todayDate = new Date().toLocaleDateString();
  
  iconsCollapsed = false;
  dbStatus: 'green' | 'yellow' | 'red' = 'green';
  dbStatusText: string = 'In-memory MongoDB';
  isShaking = false;

  // System status properties
  systemStatus: SystemStatus[] = [
    { name: 'API', status: 'unknown', lastUpdated: new Date(), icon: 'api', metrics: [] },
    { name: 'Socket', status: 'unknown', lastUpdated: new Date(), icon: 'sync_alt', metrics: [] },
    { name: 'Database', status: 'unknown', lastUpdated: new Date(), icon: 'storage', metrics: [] }
  ];
  
  backendStatus: BackendStatusSummary | null = null;
  systemHealth: EnhancedHealthData | null = null;
  
  // Enhanced system status tracking
  frontendStatus: SystemStatus = {
    name: 'Frontend',
    status: 'unknown',
    lastUpdated: new Date(),
    icon: 'memory',
    metrics: []
  };
  
  browserStatus: SystemStatus = {
    name: 'Browser',
    status: 'unknown',
    lastUpdated: new Date(),
    icon: 'web',
    metrics: []
  };
  
  databaseStatus: SystemStatus = {
    name: 'Database',
    status: 'unknown',
    lastUpdated: new Date(),
    icon: 'storage',
    metrics: []
  };
  
  // Currently selected status for details view
  activeStatus: SystemStatus | null = null;
  
  // Animation flags
  private animationInterval: ReturnType<typeof setInterval> | undefined;
  private pulseInterval: ReturnType<typeof setInterval> | undefined;

  // Subscriptions
  private subscriptions = new Subscription();
  private memoryMonitorSubscription?: Subscription;

  constructor(
    private backendStatusService: BackendStatusService,
    private diagnosticsService: DiagnosticsService
  ) {}

  ngOnInit(): void {
    this.initCalloutLines();
    
    // Default database status
    this.dbStatus = 'green';
    this.dbStatusText = 'In-memory MongoDB';
      // Subscribe to backend status updates    
    this.subscriptions.add(
      this.backendStatusService.getStatusSummary().subscribe(status => {
        this.backendStatus = status;
        this.updateSystemStatus();
      })
    );
    
    // Subscribe to health updates
    this.subscriptions.add(
      this.diagnosticsService.getHealthUpdates().subscribe(health => {
        this.systemHealth = health;
        this.updateSystemStatus();
      })
    );
    
    // Start icon animations
    this.startIconAnimations();

    // Initialize system monitoring
    this.initSystemMonitoring();
  }
  
  ngOnDestroy(): void {
    // Clear all subscriptions and intervals
    this.subscriptions.unsubscribe();
    
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
    }

    if (this.memoryMonitorSubscription) {
      this.memoryMonitorSubscription.unsubscribe();
    }
  }

  initCalloutLines(): void {
    // Initialize callout lines with sample data if userData is not available
    this.calloutLines = [
      {
        key: 'User:',
        value: this.userData?.name || 'System Guest',
        keyDelay: 500,
        keyCharDelay: 80,
        valDelay: 1200,
        valCharDelay: 50,
      },
      {
        key: 'Title:',
        value: this.userData?.title || 'Guest User',
        keyDelay: 2000,
        keyCharDelay: 80,
        valDelay: 2600,
        valCharDelay: 50,
      },
      {
        key: 'Date:',
        value: this.todayDate,
        keyDelay: 3400,
        keyCharDelay: 80,
        valDelay: 4000,
        valCharDelay: 50,
        dingVolume: 0.4, // Quieter ding for last line
      },
    ];
  }

  isCursorActive(type: 'field' | 'value', index: number): boolean {
    if (!this.animationsStarted) return false;
    
    if (type === 'field') {
      return this.activeCursor.field === index;
    } else {
      return this.activeCursor.value === index;
    }
  }

  updateCursorPosition(): void {
    // Logic for cursor position updates
    // This would typically be called on an interval
  }

  playKeySound(volume?: number): void {
    try {
      if (!this.keyStrikeSound?.nativeElement) return;
      const keyElement = this.keyStrikeSound.nativeElement;
      keyElement.currentTime = 0;
      keyElement.volume = volume || 0.3;
      keyElement.play().catch(() => {
        console.error('Error playing key sound');
      });
    } catch {
      console.error('Error setting up key sound playback');
    }
  }

  playDingSound(volume?: number): void {
    try {
      if (!this.dingSound?.nativeElement) return;
      const dingElement = this.dingSound.nativeElement;
      dingElement.currentTime = 0;
      dingElement.volume = volume || 0.6;
      dingElement.play().catch(() => {
        console.error('Error playing ding sound');
      });
    } catch {
      console.error('Error setting up ding sound playback');
    }
  }

  // Add missing methods referenced in the template
  toggleIconsCollapse(): void {
    this.iconsCollapsed = !this.iconsCollapsed;
    this.iconsCollapseToggle.emit(this.iconsCollapsed);
  }

  toggleAllGrids(): void {
    this.gridToggle.emit();
  }

  onInfoClick(): void {
    this.infoClick.emit();
  }

  onDatabaseIconClick(): void {
    this.databaseClick.emit();
  }

  onAudioIconClick(): void {
    this.audioToggle.emit(!this.audioEnabled);
    this.isShaking = true;
    setTimeout(() => this.isShaking = false, 800);
  }
  
  // Update system status based on backend status and health data
  updateSystemStatus(): void {
    // Update API status
    if (this.backendStatus) {
      const apiStatus = this.systemStatus.find(s => s.name === 'API');
      if (apiStatus) {
        apiStatus.status = this.backendStatus.allConnected ? 'healthy' : 'degraded';
        apiStatus.lastUpdated = new Date();
        
        // Set appropriate animation class
        apiStatus.animationClass = this.backendStatus.allConnected ? 'pulse-green' : 'pulse-yellow';
      }
      
      // Update Socket status
      const socketStatus = this.systemStatus.find(s => s.name === 'Socket');
      if (socketStatus) {
        // Check if any gateway is using mock data
        const usingMockData = this.backendStatus.anyMockData;
        socketStatus.status = usingMockData ? 'degraded' : 'healthy';
        socketStatus.lastUpdated = new Date();
        socketStatus.animationClass = usingMockData ? 'pulse-yellow' : 'pulse-green';
      }

      // Update backendStatusSystem
      this.updateBackendStatusSystem();
    }
    
    // Update DB status based on health data
    if (this.systemHealth) {
      const dbStatus = this.systemStatus.find(s => s.name === 'Database');
      if (dbStatus) {
        switch (this.systemHealth.status) {
          case 'healthy':
            dbStatus.status = 'healthy';
            dbStatus.animationClass = 'pulse-green';
            break;
          case 'degraded':
            dbStatus.status = 'degraded';
            dbStatus.animationClass = 'pulse-yellow';
            break;
          case 'unhealthy':
            dbStatus.status = 'unhealthy';
            dbStatus.animationClass = 'pulse-red';
            break;
          default:
            dbStatus.status = 'unknown';
            dbStatus.animationClass = 'flicker-blue';
            break;
        }
        dbStatus.lastUpdated = new Date();
      }

      // Update databaseStatus
      this.updateDatabaseStatus();
    }
  }
  
  // Start animated effects for icons
  startIconAnimations(): void {
    // Update animation classes periodically
    this.animationInterval = setInterval(() => {
      this.systemStatus.forEach(status => {
        switch (status.status) {
          case 'healthy':
            status.animationClass = 'pulse-green';
            break;
          case 'degraded':
            status.animationClass = 'pulse-yellow';
            break;
          case 'unhealthy':
            status.animationClass = 'pulse-red';
            break;
          case 'offline':
            status.animationClass = 'pulse-gray';
            break;
          default:
            status.animationClass = 'flicker-blue';
            break;
        }
      });
    }, 5000);
    
    // Add subtle animation variations
    let pulseIndex = 0;
    this.pulseInterval = setInterval(() => {
      const currentStatus = this.systemStatus[pulseIndex];
      if (currentStatus && currentStatus.status === 'healthy') {
        // Add a brief highlight pulse to a healthy icon
        currentStatus.animationClass = 'highlight-pulse';
        setTimeout(() => {
          if (currentStatus.status === 'healthy') {
            currentStatus.animationClass = 'pulse-green';
          }
        }, 1000);
      }
      
      pulseIndex = (pulseIndex + 1) % this.systemStatus.length;
    }, 7000);
  }

  // Initialize system monitoring for all tracked components
  private initSystemMonitoring(): void {
    // Monitor frontend memory usage
    this.monitorFrontendMemory();
    
    // Monitor browser resources
    this.monitorBrowserResources();
    
    // Monitor backend status (already subscribed in existing code, enhance it)
    this.enhanceBackendMonitoring();
    
    // Monitor database status
    this.monitorDatabaseStatus();
  }
  
  // Monitor frontend memory for leaks
  private monitorFrontendMemory(): void {
    if (typeof performance === 'undefined' || 
        !(performance as unknown as {memory?: PerformanceMemory}).memory) {
      this.frontendStatus.status = 'unknown';
      this.frontendStatus.message = 'Memory API not available';
      return;
    }
    
    this.memoryMonitorSubscription = interval(10000).subscribe(() => {
      // Get current memory usage
      const memory = (performance as unknown as {memory: PerformanceMemory}).memory;
      const usedHeap = memory.usedJSHeapSize / (1024 * 1024);
      const totalHeap = memory.totalJSHeapSize / (1024 * 1024);
      const usagePercent = (usedHeap / totalHeap) * 100;
      
      // Track usage over time to detect leaks
      this.frontendStatus.metrics = [
        {
          name: 'Heap Used',
          value: `${usedHeap.toFixed(1)} MB`,
          status: usedHeap > totalHeap * 0.8 ? 'degraded' : 'healthy'
        },
        {
          name: 'Total Heap',
          value: `${totalHeap.toFixed(1)} MB`,
          status: 'healthy'
        },
        {
          name: 'Usage',
          value: `${usagePercent.toFixed(1)}%`,
          status: usagePercent > 85 ? 'unhealthy' : (usagePercent > 70 ? 'degraded' : 'healthy')
        }
      ];
      
      // Determine status based on metrics
      if (this.frontendStatus.metrics.some(m => m.status === 'unhealthy')) {
        this.frontendStatus.status = 'unhealthy';
        this.frontendStatus.message = 'High memory usage detected. Consider refreshing the page.';
        this.frontendStatus.animationClass = 'pulse-red';
      } else if (this.frontendStatus.metrics.some(m => m.status === 'degraded')) {
        this.frontendStatus.status = 'degraded';
        this.frontendStatus.message = 'Memory usage is elevated.';
        this.frontendStatus.animationClass = 'pulse-yellow';
      } else {
        this.frontendStatus.status = 'healthy';
        this.frontendStatus.message = 'Memory usage is normal.';
        this.frontendStatus.animationClass = 'pulse-green';
      }
      
      this.frontendStatus.lastUpdated = new Date();
    });
  }
  
  // Monitor browser resources
  private monitorBrowserResources(): void {
    // Use Resource Timing API and Navigation Timing API
    interval(5000).subscribe(() => {
      try {
        // Check connection
        const connection = (navigator as unknown as {connection?: NavigatorConnection}).connection;
        const networkInfo = connection ? {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt
        } : null;
        
        // Page load metrics
        const pageLoadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        
        this.browserStatus.metrics = [
          {
            name: 'Page Load',
            value: `${(pageLoadTime / 1000).toFixed(2)}s`,
            status: pageLoadTime > 5000 ? 'degraded' : 'healthy'
          },
          {
            name: 'Network',
            value: networkInfo ? `${networkInfo.effectiveType}` : 'Unknown',
            status: networkInfo && networkInfo.effectiveType === '4g' ? 'healthy' : 'degraded'
          }
        ];
        
        // Determine overall status
        if (this.browserStatus.metrics.some(m => m.status === 'unhealthy')) {
          this.browserStatus.status = 'unhealthy';
          this.browserStatus.animationClass = 'pulse-red';
        } else if (this.browserStatus.metrics.some(m => m.status === 'degraded')) {
          this.browserStatus.status = 'degraded';
          this.browserStatus.animationClass = 'pulse-yellow';
        } else {
          this.browserStatus.status = 'healthy';
          this.browserStatus.animationClass = 'pulse-green';
        }
        
        this.browserStatus.lastUpdated = new Date();
      } catch (err) {
        this.browserStatus.status = 'unknown';
        this.browserStatus.message = 'Error monitoring browser resources';
        this.browserStatus.animationClass = 'flicker-blue';
      }
    });
  }
  
  // Show detailed status view
  showStatusDetails(status: SystemStatus): void {
    this.activeStatus = status;
  }
  
  // Close status details overlay
  closeStatusDetails(): void {
    this.activeStatus = null;
  }
  
  // Attempt recovery action based on status type
  attemptRecovery(status: SystemStatus): void {
    switch (status.name) {
      case 'Frontend':
        // Clear caches, reload resources, etc.
        console.log('Attempting frontend recovery');
        window.location.reload();
        break;
        
      case 'Backend':
        // Attempt to reconnect to backend services
        console.log('Attempting backend recovery');
        this.backendStatusService.forceReconnectionCheck();
        break;
        
      case 'Database':
        // Attempt database recovery
        console.log('Attempting database recovery');
        // Call appropriate service method
        break;
        
      default:
        console.log(`No recovery action defined for ${status.name}`);
    }
  }
  
  // Get tooltip text for status icons
  getStatusTooltip(status: SystemStatus): string {
    const timeString = status.lastUpdated.toLocaleTimeString();
    
    switch (status.status) {
      case 'healthy':
        return `${status.name}: Operating normally (${timeString})`;
      case 'degraded':
        return `${status.name}: Performance issues detected (${timeString})`;
      case 'unhealthy':
        return `${status.name}: Critical issues detected! (${timeString})`;
      default:
        return `${status.name}: Status unknown (${timeString})`;
    }
  }

  // Create a property to convert backendStatus to SystemStatus type
  get backendStatusSystem(): SystemStatus {
    if (!this.backendStatus) {
      return {
        name: 'Backend',
        status: 'unknown',
        lastUpdated: new Date(),
        icon: 'cloud',
        metrics: [],
        animationClass: 'flicker-blue'
      };
    }
    
    return {
      name: 'Backend',
      status: this.backendStatus.allConnected ? 'healthy' : 'degraded',
      lastUpdated: new Date(),
      icon: 'cloud',
      metrics: [
        {
          name: 'Connected Gateways',
          value: this.backendStatus.gateways ? this.backendStatus.gateways.length : 0,
          status: this.backendStatus.allConnected ? 'healthy' : 'degraded'
        },
        {
          name: 'Mock Data',
          value: this.backendStatus.anyMockData ? 'Yes' : 'No',
          status: this.backendStatus.anyMockData ? 'degraded' : 'healthy'
        }
      ],
      animationClass: this.backendStatus.allConnected ? 'pulse-green' : 'pulse-yellow',
      message: this.backendStatus.anyMockData ? 'Using mock data due to connectivity issues' : undefined
    };
  }

  // Update backendStatusSystem based on current backendStatus
  private updateBackendStatusSystem(): void {
    // No need to implement this method as we're using a getter
    // This method is just a placeholder to avoid the TypeScript error
  }
  // Update database status based on systemHealth
  private updateDatabaseStatus(): void {
    if (!this.systemHealth || !this.systemHealth.details || !this.systemHealth.details['database']) {
      return;
    }

    // Cast to known structure first to avoid type mismatch
    const dbHealth = this.systemHealth.details['database'] as unknown as DatabaseHealth;
    
    this.databaseStatus.metrics = [
      {
        name: 'Connection Pool',
        value: dbHealth.connections?.active || 'N/A',
        status: this.mapStatusString(dbHealth.connections?.status)
      },
      {
        name: 'Query Time',
        value: `${dbHealth.performance?.avgQueryTime || 'N/A'} ms`,
        status: this.mapStatusString(dbHealth.performance?.status)
      },
      {
        name: 'Storage',
        value: `${dbHealth.storage?.used || 'N/A'} MB`,
        status: this.mapStatusString(dbHealth.storage?.status)
      }
    ];
    
    // Use type-safe comparisons
    const status = dbHealth.status?.toLowerCase() || '';
    if (status === 'error') {
      this.databaseStatus.status = 'unhealthy';
      this.databaseStatus.animationClass = 'pulse-red';
    } else if (status === 'warning') {
      this.databaseStatus.status = 'degraded';
      this.databaseStatus.animationClass = 'pulse-yellow';
    } else {
      this.databaseStatus.status = 'healthy';
      this.databaseStatus.animationClass = 'pulse-green';
    }
    
    this.databaseStatus.message = dbHealth.message || '';
    this.databaseStatus.lastUpdated = new Date();
  }
  
  // Helper method to map string status to enum status
  private mapStatusString(status?: string): 'healthy' | 'degraded' | 'unhealthy' {
    if (!status) return 'healthy';
    switch(status.toLowerCase()) {
      case 'error': return 'unhealthy';
      case 'warning': return 'degraded';
      default: return 'healthy';
    }
  }

  /**
   * Enhance backend monitoring with additional metrics and tracking
   */
  private enhanceBackendMonitoring(): void {    // Subscribe to backend status service for detailed metrics
    this.subscriptions.add(
      this.backendStatusService.getStatusSummary().subscribe(status => {
        if (!status) return;
        
        // Update metrics based on gateway status
        let connectedGateways = 0;
        let totalGateways = 0;
        
        if (status.gateways && Array.isArray(status.gateways)) {
          totalGateways = status.gateways.length;
          connectedGateways = status.gateways.filter(g => g.connected).length;
        }
        
        // Add metrics to backendStatusSystem
        const backendSystem = this.backendStatusSystem;
        backendSystem.metrics = [
          {
            name: 'Connected Gateways',
            value: `${connectedGateways}/${totalGateways}`,
            status: connectedGateways === totalGateways ? 'healthy' : 'degraded'
          },
          {
            name: 'Mock Data',
            value: status.anyMockData ? 'Yes' : 'No',
            status: status.anyMockData ? 'degraded' : 'healthy'
          }
        ];
        
        // Determine overall status
        if (!status.allConnected) {
          backendSystem.status = 'degraded';
          backendSystem.message = 'Some services are disconnected';
          backendSystem.animationClass = 'pulse-yellow';
        } else if (status.anyMockData) {
          backendSystem.status = 'degraded';
          backendSystem.message = 'Using mock data due to connectivity issues';
          backendSystem.animationClass = 'pulse-yellow';
        } else {
          backendSystem.status = 'healthy';
          backendSystem.message = 'All backend services connected';
          backendSystem.animationClass = 'pulse-green';
        }
        
        backendSystem.lastUpdated = new Date();
      })
    );
    
    // Subscribe to diagnostics health updates for more backend info
    this.subscriptions.add(
      this.diagnosticsService.getHealthUpdates().subscribe(health => {
        if (!health) return;
        
        // Add additional metrics from health data
        const backendSystem = this.backendStatusSystem;
        const existingMetrics = [...backendSystem.metrics];
        
        // Add uptime metric if available
        if (health.uptime) {
          const uptimeMetric = {
            name: 'Uptime',
            value: this.formatUptime(health.uptime),
            status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy'
          };
          
          // Replace existing uptime metric or add new one
          const uptimeIndex = existingMetrics.findIndex(m => m.name === 'Uptime');
          if (uptimeIndex >= 0) {
            existingMetrics[uptimeIndex] = uptimeMetric;
          } else {
            existingMetrics.push(uptimeMetric);
          }
        }
        
        // Update backend metrics
        backendSystem.metrics = existingMetrics;
        backendSystem.lastUpdated = new Date();
      })
    );
  }

  /**
   * Monitor database status and metrics
   */
  private monitorDatabaseStatus(): void {
    // Initially set database status to unknown
    this.databaseStatus.status = 'unknown';
    this.databaseStatus.message = 'Connecting to database...';
    this.databaseStatus.animationClass = 'flicker-blue';
    
    // Subscribe to health updates for database information
    this.subscriptions.add(
      this.diagnosticsService.getHealthUpdates().subscribe(health => {
        if (!health || !health.details) return;
        
        // Try to extract database status from health details
        const dbDetails = health.details['database'];
        if (!dbDetails) return;
        
        try {          // Parse database details (might be a string that needs parsing)
          const dbHealth = typeof dbDetails === 'string' 
            ? JSON.parse(dbDetails)
            : dbDetails as Record<string, unknown>;
          
          // Extract database metrics
          this.databaseStatus.metrics = [
            {
              name: 'Status',
              value: dbHealth.status || 'unknown',
              status: this.mapDatabaseStatus(dbHealth.status)
            }
          ];
          
          // Add connection metrics if available
          if (dbHealth.connections) {
            this.databaseStatus.metrics.push({
              name: 'Connections',
              value: dbHealth.connections.active || '0',
              status: this.mapStatusString(dbHealth.connections.status)
            });
          }
          
          // Add performance metrics if available
          if (dbHealth.performance) {
            this.databaseStatus.metrics.push({
              name: 'Query Time',
              value: `${dbHealth.performance.avgQueryTime || 'N/A'} ms`,
              status: this.mapStatusString(dbHealth.performance.status)
            });
          }
          
          // Add storage metrics if available
          if (dbHealth.storage) {
            this.databaseStatus.metrics.push({
              name: 'Storage',
              value: `${dbHealth.storage.used || 'N/A'} MB`,
              status: this.mapStatusString(dbHealth.storage.status)
            });
          }
          
          // Update database status
          this.databaseStatus.status = this.mapDatabaseStatus(dbHealth.status);
          this.databaseStatus.message = dbHealth.message || '';
          
          // Set appropriate animation class
          switch (this.databaseStatus.status) {
            case 'healthy':
              this.databaseStatus.animationClass = 'pulse-green';
              break;
            case 'degraded':
              this.databaseStatus.animationClass = 'pulse-yellow';
              break;
            case 'unhealthy':
              this.databaseStatus.animationClass = 'pulse-red';
              break;
            default:
              this.databaseStatus.animationClass = 'flicker-blue';
          }
          
          this.databaseStatus.lastUpdated = new Date();
        } catch (error) {
          console.error('Error parsing database health data:', error);
          this.databaseStatus.status = 'unknown';
          this.databaseStatus.message = 'Error parsing database status';
          this.databaseStatus.animationClass = 'flicker-blue';
        }
      })
    );
    
    // Fallback for when no database status is available after some time
    setTimeout(() => {
      if (this.databaseStatus.status === 'unknown') {
        this.databaseStatus.message = 'No database information available';
        this.databaseStatus.metrics = [
          {
            name: 'Status',
            value: 'Unknown',
            status: 'degraded'
          }
        ];
      }
    }, 10000); // Wait 10 seconds for data before showing fallback
  }
  
  /**
   * Map database status string to system status
   */
  private mapDatabaseStatus(status?: string): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    if (!status) return 'unknown';
    
    switch (status.toLowerCase()) {
      case 'up':
      case 'healthy':
      case 'green':
      case 'ok':
        return 'healthy';
      case 'degraded':
      case 'warning':
      case 'yellow':
        return 'degraded';
      case 'down':
      case 'unhealthy':
      case 'error':
      case 'red':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  }

  // Helper function to format uptime (to be used in enhanceBackendMonitoring)
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}
