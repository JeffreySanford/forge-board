import { Component, ViewChild, ElementRef, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { UserData } from '../../services/user-data.service';
import { BackendStatusService, BackendStatusSummary } from '../../services/backend-status.service';
import { DiagnosticsService } from '../../services/diagnostics.service';
import { Subscription } from 'rxjs';
import { HealthData } from '@forge-board/shared/api-interfaces';

interface CalloutLine {
  key: string;
  value: string;
  keyDelay: number;
  keyCharDelay: number;
  valDelay: number;
  valCharDelay: number;
  dingVolume?: number;
}

interface SystemStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'offline';
  lastUpdated: Date;
  icon: string;
  animationClass?: string;
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
  
  // Add missing properties referenced in the template
  iconsCollapsed = false;
  dbStatus: 'green' | 'yellow' | 'red' = 'green';
  dbStatusText: string = 'In-memory MongoDB';
  isShaking = false;

  // System status properties
  systemStatus: SystemStatus[] = [
    { name: 'API', status: 'unknown', lastUpdated: new Date(), icon: 'api' },
    { name: 'Socket', status: 'unknown', lastUpdated: new Date(), icon: 'sync_alt' },
    { name: 'Database', status: 'unknown', lastUpdated: new Date(), icon: 'storage' }
  ];
  
  backendStatus: BackendStatusSummary | null = null;
  systemHealth: HealthData | null = null;
  
  // Animation flags
  private animationInterval: any;
  private pulseInterval: any;

  // Subscriptions
  private subscriptions = new Subscription();

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
      this.backendStatusService.getStatus().subscribe(status => {
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
  
  // Get tooltip text for status icon
  getStatusTooltip(status: SystemStatus): string {
    const timeString = status.lastUpdated.toLocaleTimeString();
    switch (status.status) {
      case 'healthy':
        return `${status.name} services operating normally (${timeString})`;
      case 'degraded':
        return `${status.name} services experiencing issues (${timeString})`;
      case 'unhealthy':
        return `${status.name} services unavailable (${timeString})`;
      case 'offline':
        return `${status.name} services offline (${timeString})`;
      default:
        return `${status.name} status unknown (${timeString})`;
    }
  }
}
