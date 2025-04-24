import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { from, of, interval, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserData } from './services/user-data.service';
import { TileType, TileDragEvent } from './models/tile.model';
import { TileStateService } from './services/tile-state.service';

@Component({
  selector: 'app-root',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'forgeboard-frontend';
  currentDate = new Date().toLocaleDateString();
  todayDate = new Date().toLocaleDateString();
  showCallout = false;
  animationsStarted = false;
  audioEnabled = false;
  isShaking = false;
  isMuted = false;
  userData: UserData | null = null;
  
  // Remove callout-specific cursor and lines
  private shakeInterval: Subscription | null = null;
  @ViewChild('keyStrikeSound') keyStrikeSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('dingSound') dingSound!: ElementRef<HTMLAudioElement>;
  private isAudioInitialized = false;
  private soundErrorsLogged = false;
  private typingSoundInterval: ReturnType<typeof setInterval> | null = null;
  showLayoutBorder = true;
  showContextBlock = true;
  showMetricsTile = true;
  layoutWiggle = false;
  tileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];

  is12ColumnVisible = false;
  is4ColumnVisible = false;
  isSmallGridVisible = false;
  isLargeGridVisible = false;

  constructor(
    private tileStateService: TileStateService
  ) {
    // Initialize with default order, will be updated from backend in ngAfterViewInit
    this.tileOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
  }

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

  ngOnDestroy() {
    if (this.shakeInterval) {
      this.shakeInterval.unsubscribe();
    }
    this.stopContinuousTyping();
  }

  startShakingInterval() {
    this.shakeInterval = interval(5000).subscribe(() => {
      this.isShaking = true;
      setTimeout(() => {
        this.isShaking = false;
      }, 800);
    });
  }

  enableAudio() {
    this.audioEnabled = true;
    if (this.shakeInterval) {
      this.shakeInterval.unsubscribe();
      this.shakeInterval = null;
    }
    this.isAudioInitialized = true;
    setTimeout(() => {
      this.startAnimations();
    }, 500);
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
    ];
    soundFiles.forEach((sound) => {
      if (sound.ref?.nativeElement) {
        sound.ref.nativeElement.volume = sound.volume;
        sound.ref.nativeElement.muted = false;
        try {
          sound.ref.nativeElement.load();
        } catch {
          console.error('Error preloading audio:', sound.ref.nativeElement.src);
        }
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

  playKeySound(volume?: number) {
    try {
      if (!this.keyStrikeSound?.nativeElement) return;
      const keyElement = this.keyStrikeSound.nativeElement;
      keyElement.currentTime = 0;
      keyElement.volume = volume || 0.2;
      keyElement
        .play()
        .then(() => {
          // Optionally, you could trigger a visual effect for the key sound
          // e.g., this.showKeySoundIndicator();
        })
        .catch(() => {
          if (!this.soundErrorsLogged) {
            this.soundErrorsLogged = true;
          }
          console.error('Error playing key sound:', keyElement.src);
        });
    } catch {
      console.error(
        'Error playing key sound:',
        this.keyStrikeSound.nativeElement.src
      );
    }
  }

  playDingSound(volume?: number) {
    try {
      if (!this.dingSound?.nativeElement) return;
      const dingElement = this.dingSound.nativeElement;
      dingElement.currentTime = 0;
      dingElement.volume = volume || 0.6;
      dingElement
        .play()
        .then(() => {
          // Optionally, you could trigger a visual effect for the "ding"
          // e.g., this.showDingIndicator();
        })
        .catch(() => {
          if (!this.soundErrorsLogged) {
            // Optionally, show a notification or log
            alert('Ding sound failed to play.');
            this.soundErrorsLogged = true;
          }
        });
    } catch {
      // Optionally, show a notification or log
      alert('Error setting up ding sound playback.');
    }
  }

  toggleMute(event: Event) {
    event.stopPropagation();
    this.isMuted = !this.isMuted;
    // Only toggle sound mute/unmute, do not affect layout or tiles
    const audioElements = [this.keyStrikeSound, this.dingSound];
    audioElements.forEach((element) => {
      if (element?.nativeElement) {
        element.nativeElement.muted = this.isMuted;
      }
    });
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

  // Method to toggle tile visibility
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
      activity: true
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
    // no-op for now
  }
}
