import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { from, of, interval, Observable, Subscription } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { UserDataService, UserData } from './services/user-data.service';
import { TileType } from './models/tile.model';
import { TileStateService } from './services/tile-state.service';
import { SoundHelperService, SoundType } from './services/sound-helper.service';
import { ProjectConfigService } from './services/project-config.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { environment } from '../environments/environment';
import { NavigationComponent } from './components/navigation/navigation.component';

/**
 * Main application component that manages global state and layout
 * 
 * Provides:
 * - Audio feedback management
 * - Layout visualization tools
 * - Tile drag and drop organization
 * - User context display
 */
@Component({
  selector: 'app-root',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  // Add ViewChild reference to the NavigationComponent
  @ViewChild(NavigationComponent) navigationComponent!: NavigationComponent;
  
  title = 'forgeboard-frontend';
  projectName = 'PROJECT: FORGEBOARD'; // Default fallback
  currentDate = new Date().toLocaleDateString();
  todayDate = new Date().toLocaleDateString();
  showCallout = false;
  animationsStarted = false;
  audioEnabled = false;
  isShaking = false;
  isMuted = false;
  userData: UserData | null = null;
  private userDataSubscription: Subscription | null = null;
  private projectNameSubscription: Subscription | null = null;
  
  // Add properties for responsive layout
  isHandset$: Observable<boolean>;
  
  // Add properties for header controls
  iconsCollapsed = false;
  dbStatus: 'green' | 'yellow' | 'red' = 'green';
  dbStatusText: string = 'In-memory MongoDB';
  
  // Remove callout-specific cursor and lines
  private shakeInterval: Subscription | null = null;
  @ViewChild('keyStrikeSound') keyStrikeSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('dingSound') dingSound!: ElementRef<HTMLAudioElement>;
  private isAudioInitialized = false;
  private soundErrorsLogged = false;
  private typingSoundInterval: ReturnType<typeof setInterval> | null = null;
  showLayoutBorder = true;
  showContainerIndicators = true;
  showContextBlock = true;
  showMetricsTile = true;
  layoutWiggle = false;
  tileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];

  is12ColumnVisible = false;
  is4ColumnVisible = false;
  isSmallGridVisible = false;
  isLargeGridVisible = false;
  private subscription = new Subscription(); // Add this line to declare the subscription property

  // Add references for ambient sounds
  @ViewChild('ambientSound') ambientSound?: ElementRef<HTMLAudioElement>;
  @ViewChild('starsAndStripesSound') starsAndStripesSound?: ElementRef<HTMLAudioElement>;

  constructor(
    private projectConfigService: ProjectConfigService,
    private tileStateService: TileStateService,
    private soundHelper: SoundHelperService,
    private userDataService: UserDataService,
    private breakpointObserver: BreakpointObserver
  ) {
    // Initialize with default order, will be updated from backend in ngAfterViewInit
    this.tileOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
    
    // Initialize isHandset$ in the constructor
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  /**
   * Initialize component after Angular has initialized all data-bound properties
   */
  ngOnInit(): void {
    // Initialize component state
    console.log('[AppComponent] Component initialized');
    
    // Check audio settings from local storage
    this.loadAudioSettings();
    
    // Load user data
    this.loadUserData();

    // Subscribe to project name changes
    this.projectNameSubscription = this.projectConfigService.getProjectName()
      .subscribe(name => {
        this.projectName = name;
      });
      
    // Initialize database status from environment
    this.dbStatus = environment.useInMemoryMongo ? 'green' : 'yellow';
    this.dbStatusText = environment.mongoUri;
  }

  /**
   * Initialize view-related functionality after the view is fully initialized
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.showCallout = true;
      this.startShakingInterval();
    }, 1000);
    this.preloadAudioAssets();
    this.setupUserDataService();
    this.showLayoutBorder = true;
    this.showContextBlock = true;
    this.showMetricsTile = true;

    // Load tile order from backend
    this.tileStateService.getTileOrder('user1').subscribe(res => {
      if (res.order && res.order.length) {
        this.tileOrder = res.order as TileType[];
        
        // Apply visibility settings if available
        if (res.visibility) {
          this.showMetricsTile = res.visibility['metrics'] !== false;
          // Update other visibility flags as needed
        }
      }
    });
  }

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
    if (this.shakeInterval) {
      this.shakeInterval.unsubscribe();
    }
    this.stopContinuousTyping();

    // Clean up user data subscription
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }

    // Clean up project name subscription
    if (this.projectNameSubscription) {
      this.projectNameSubscription.unsubscribe();
    }
  }

  startShakingInterval() {
    this.shakeInterval = interval(5000).subscribe(() => {
      this.isShaking = true;
      setTimeout(() => {
        this.isShaking = false;
      }, 800);
    });
  }

  enableAudio(): void {
    this.audioEnabled = true;
    if (this.shakeInterval) {
      this.shakeInterval.unsubscribe();
      this.shakeInterval = null;
    }
    this.isAudioInitialized = true;
    
    // Initialize the sound helper service
    this.subscription.add(
      this.soundHelper.initialize().subscribe(success => {
        if (success) {
          // Set enabled once initialized
          this.soundHelper.setEnabled(true);
          
          setTimeout(() => {
            this.startAnimations();
          }, 500);
        }
      })
    );
  }

  preloadAudioAssets() {
    setTimeout(() => {
      const audioElements = [this.keyStrikeSound, this.dingSound];
      audioElements.forEach((element) => {
        if (element?.nativeElement) {
          try {
            element.nativeElement.load();
          } catch {
            console.error('Error preloading audio:', element.nativeElement.src);
          }
        }
      });
    }, 1000);
  }

  startAnimations() {
    if (!this.animationsStarted && this.audioEnabled) {
      this.animationsStarted = true;
      setTimeout(() => {
        this.initializeAudio();
      }, 50);
    }
  }

  initializeAudio() {
    this.setupAudioElements();
    this.createAudioContext();
    this.preloadAudioElements();
  }

  setupAudioElements() {
    const audioElements = [
      { ref: this.keyStrikeSound, name: 'keyStrikeSound' },
      { ref: this.dingSound, name: 'dingSound' },
    ];
    audioElements.forEach((elem) => {
      if (!elem.ref?.nativeElement) return;
      const filePath = elem.ref.nativeElement.src;
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', filePath, true);
      xhr.onload = () => {
        if (!(xhr.status >= 200 && xhr.status < 300)) {
          this.insertFallbackAudio();
        }
      };
      xhr.onerror = () => {
        this.insertFallbackAudio();
      };
      xhr.send();
    });
  }

  insertFallbackAudio() {
    const soundElements = [
      { ref: this.keyStrikeSound, name: 'keyStrikeSound' },
      { ref: this.dingSound, name: 'dingSound' },
    ];
    soundElements.forEach((sound) => {
      if (sound.ref?.nativeElement) {
        sound.ref.nativeElement.src = 'data:audio/mpeg;base64,...';
        sound.ref.nativeElement.volume = 0.0;
        sound.ref.nativeElement.muted = true;
        sound.ref.nativeElement.load();
        sound.ref.nativeElement.preload = 'auto';
      }
    });
  }

  testAudioPlayback() {
    setTimeout(() => {
      if (this.keyStrikeSound?.nativeElement) {
        this.keyStrikeSound.nativeElement.volume = 0.6;
        from(this.keyStrikeSound.nativeElement.play())
          .pipe(
            tap(() => {
              // Optionally show a UI indicator that sound playback succeeded
              // e.g., this.soundTestStatus = 'success';
            }),
            catchError(() => {
              // Optionally show a UI indicator that sound playback failed
              // e.g., this.soundTestStatus = 'failure';
              // You could also display a toast or notification here
              alert(
                'Audio test failed. Please check your sound files or browser settings.'
              );
              return of(null);
            })
          )
          .subscribe();
      }
    }, 100);
  }

  private audioContext: AudioContext | undefined;

  createAudioContext() {
    try {
      const AudioCtx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext) as typeof AudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        from(this.audioContext.resume())
          .pipe(
            tap(() => {
              // Optionally show a UI indicator that audio context resumed
              // e.g., this.audioContextStatus = 'resumed';
            }),
            catchError(() => {
              return of(null);
            })
          )
          .subscribe();
      }
    } catch {
      console.error('AudioContext not supported in this browser.');
    }
  }

  preloadAudioElements() {
    const soundFiles = [
      { ref: this.keyStrikeSound, volume: 0.2, name: 'keyStrikeSound' },
      { ref: this.dingSound, volume: 0.5, name: 'dingSound' },
      // Add optional ambient sounds with null checks
      { ref: this.ambientSound, volume: 0.3, name: 'ambientSound', optional: true },
      { ref: this.starsAndStripesSound, volume: 0.4, name: 'starsAndStripesSound', optional: true },
    ];
    
    soundFiles.forEach((sound) => {
      if (sound.ref?.nativeElement) {
        sound.ref.nativeElement.volume = sound.volume;
        sound.ref.nativeElement.muted = false;
        try {
          sound.ref.nativeElement.load();
        } catch (e) {
          if (!sound.optional) {
            console.error(`Error preloading audio: ${sound.name}`, e);
          } else {
            console.warn(`Optional sound file not found: ${sound.name}`);
          }
        }
      } else if (sound.optional) {
        console.info(`Optional sound element not available: ${sound.name}`);
      }
    });
    
    setTimeout(() => {
      this.testAudioPlayback();
    }, 500);
  }

  startContinuousTyping() {
    if (this.typingSoundInterval) {
      clearInterval(this.typingSoundInterval);
      this.typingSoundInterval = null;
    }
  }

  playCharacterSound() {
    const volume = 0.15 + Math.random() * 0.1;
    this.playKeySound(volume);
    // Optionally, you could trigger a visual effect here for each character
    return true;
  }

  stopContinuousTyping() {
    if (this.typingSoundInterval) {
      clearInterval(this.typingSoundInterval);
      this.typingSoundInterval = null;
    }
  }

  playKeySound(volume?: number): void {
    if (this.audioEnabled) {
      this.soundHelper.playSound(SoundType.KEYSTRIKE, volume).subscribe();
    }
  }

  playDingSound(volume?: number): void {
    if (this.audioEnabled) {
      this.soundHelper.playSound(SoundType.DING, volume).subscribe();
    }
  }

  toggleMute(event: Event): void {
    event.stopPropagation();
    this.isMuted = !this.isMuted;
    this.soundHelper.setMuted(this.isMuted);
  }

  toggleContextBlock() {
    this.showContextBlock = !this.showContextBlock;
  }

  toggleLayoutMode() {
    // Wiggle animation for blue layout button
    this.layoutWiggle = true;
    setTimeout(() => (this.layoutWiggle = false), 800);

    // Toggle all layout-related overlays, context block, and metrics tile
    this.showLayoutBorder = !this.showLayoutBorder;
    this.showContextBlock = !this.showContextBlock;
    this.showMetricsTile = !this.showMetricsTile;
    // Toggle overlays as well
    this.is12ColumnVisible = !this.is12ColumnVisible;
    this.is4ColumnVisible = !this.is4ColumnVisible;
    this.isSmallGridVisible = !this.isSmallGridVisible;
    this.isLargeGridVisible = !this.isLargeGridVisible;
  }

  toggle12ColumnOverlay() {
    this.is12ColumnVisible = !this.is12ColumnVisible;
  }

  toggle4ColumnOverlay() {
    this.is4ColumnVisible = !this.is4ColumnVisible;
  }

  toggleSmallGridOverlay() {
    this.isSmallGridVisible = !this.isSmallGridVisible;
  }

  toggleLargeGridOverlay() {
    this.isLargeGridVisible = !this.isLargeGridVisible;
  }

  /**
   * Handles drag and drop events for tile reordering
   * 
   * @param event The drag drop event containing previous and current indices
   */
  onTileDrop(event: CdkDragDrop<TileType[]>): void {
    // First update the local array for immediate UI feedback
    moveItemInArray(this.tileOrder, event.previousIndex, event.currentIndex);
    
    // Then persist to backend with error handling
    this.tileStateService.setTileOrder('user1', this.tileOrder)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            // Optionally show a message that the save failed
            console.warn('Failed to save tile order');
          }
        },
        error: (err) => {
          console.error('Error saving tile order:', err);
          // Optionally show an error message to the user
        }
      });
  }

  /**
   * Handles tile visibility events from child components
   * 
   * @param event The tile visibility event
   */
  onChildDragEvent(event: TileVisibilityChangedEvent): void {
    // Log the event and directly process it since we only have one event type
    console.log(`[AppComponent] Processing tile visibility change for: ${event.data.tileType}`);
    
    // Directly update tile visibility without type checking
    this.toggleTileVisibility(event.data.tileType);
  }

  /**
   * Method to toggle tile visibility
   * 
   * @param tileType The type of tile whose visibility is being toggled
   */
  toggleTileVisibility(tileType: TileType): void {
    // Update local state based on tile type
    if (tileType === 'metrics') {
      this.showMetricsTile = !this.showMetricsTile;
    }
    // Add similar toggles for other tile types as needed
    
    // Persist visibility settings
    const visibility = {
      metrics: this.showMetricsTile,
      connection: true, // Update with actual visibility states
      logs: true,
      uptime: true,
      activity: true,
      kablan: true 
    };
    
    this.tileStateService.setTileVisibility('user1', visibility)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn('Failed to save tile visibility');
          }
        },
        error: (err) => {
          console.error('Error saving tile visibility:', err);
        }
      });
  }

  setupUserDataService() {
    // This method can remain as a no-op or be removed if not needed
    // The actual initialization happens in loadUserData
  }

  /**
   * Load audio settings from local storage
   */
  private loadAudioSettings(): void {
    const savedAudioSettings = localStorage.getItem('audioEnabled');
    if (savedAudioSettings !== null) {
      this.audioEnabled = savedAudioSettings === 'true';
    }
  }
  
  /**
   * Load user data from service
   */
  private loadUserData(): void {
    this.userDataSubscription = this.userDataService.getUserData()
      .subscribe({
        next: (userData: UserData) => {
          this.userData = userData;
        },
        error: (err: Error) => {
          console.error('[AppComponent] Error loading user data:', err);
        }
      });
  }

  // Add new method to toggle container indicators
  toggleContainerIndicators(): void {
    this.showContainerIndicators = !this.showContainerIndicators;
  }

  /**
   * Plays a sound when showing tooltips if audio is enabled
   */
  onTooltipShow(): void {
    if (this.audioEnabled) {
      // Play a subtle hover sound
      this.playKeySound(0.1); // Lower volume for tooltip hover
    }
  }

  // Add new methods for header controls
  onConnectionStatusClick(): void {
    // This method is just a placeholder since the actual action happens in the component itself
    console.log('Connection status clicked');
  }
  
  toggleIconsCollapse(): void {
    this.iconsCollapsed = !this.iconsCollapsed;
  }
  
  toggleAllGrids(): void {
    this.is12ColumnVisible = !this.is12ColumnVisible;
    this.is4ColumnVisible = !this.is4ColumnVisible;
    this.isSmallGridVisible = !this.isSmallGridVisible;
    this.isLargeGridVisible = !this.isLargeGridVisible;
  }
  
  onInfoClick(): void {
    // Show info panel or modal
    alert('ForgeBoard Dashboard\n\nVersion 1.0.0\n\nA blueprint-style dashboard for system monitoring and control.');
  }
  
  onDatabaseIconClick(): void {
    // Show database connection details or modal
    alert(`Database Status: ${this.dbStatusText}\nConnection: ${this.dbStatus === 'green' ? 'Healthy' : this.dbStatus === 'yellow' ? 'Warning' : 'Error'}`);
  }
  
  onAudioIconClick(): void {
    this.audioEnabled = !this.audioEnabled;
    this.isShaking = true;
    setTimeout(() => this.isShaking = false, 800);
    localStorage.setItem('audioEnabled', this.audioEnabled.toString());
    
    if (this.audioEnabled && !this.isAudioInitialized) {
      this.enableAudio();
    } else {
      this.soundHelper.setEnabled(this.audioEnabled);
    }
  }
  
  // Handle events from footer component
  handleFooterIconsCollapseToggle(collapsed: boolean): void {
    this.iconsCollapsed = collapsed;
  }
  
  handleFooterGridToggle(): void {
    this.toggleAllGrids();
  }
  
  handleFooterInfoClick(): void {
    this.onInfoClick();
  }
  
  handleFooterDatabaseClick(): void {
    this.onDatabaseIconClick();
  }
  
  handleFooterAudioToggle(enabled: boolean): void {
    if (this.audioEnabled !== enabled) {
      this.onAudioIconClick();
    }
  }

  /**
   * Toggles the navigation drawer by accessing the navigation component
   */
  toggleNavigation(): void {
    if (this.navigationComponent) {
      this.navigationComponent.toggleDrawer();
    }
  }
}

// Simplified event interface - we don't need a union type anymore
interface TileVisibilityChangedEvent {
  type: 'tile-visibility-changed';
  data: {
    tileType: TileType;
  };
}
