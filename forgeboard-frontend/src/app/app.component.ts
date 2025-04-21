import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { from, of, interval, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserData } from './services/user-data.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
  activeCursor = { field: -1, value: -1 };
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
  tileOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'];

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
      this.updateCursorPosition();
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

  isCursorActive(type: 'field' | 'value', index: number): boolean {
    return this.animationsStarted && this.activeCursor[type] === index;
  }

  updateCursorPosition() {
    const lineStartTimes = [0, 2, 4, 6, 8];
    const valueStartTimes = [1, 3.2, 4.8, 7, 9];
    const fieldDurations = [1, 1.2, 0.8, 1, 1.1];
    const valueDurations = [1.4, 1.5, 1.6, 1, 1];
    this.activeCursor = { field: -1, value: -1 };
    lineStartTimes.forEach((time, idx) => {
      setTimeout(() => {
        this.activeCursor.field = idx;
        this.activeCursor.value = -1;
      }, time * 1000);
      setTimeout(() => {
        if (this.activeCursor.field === idx) {
          this.activeCursor.field = -1;
        }
      }, (time + fieldDurations[idx]) * 1000);
    });
    valueStartTimes.forEach((time, idx) => {
      setTimeout(() => {
        this.activeCursor.field = -1;
        this.activeCursor.value = idx;
      }, time * 1000);
      setTimeout(() => {
        if (this.activeCursor.value === idx) {
          this.activeCursor.value = -1;
        }
      }, (time + valueDurations[idx]) * 1000);
    });
  }

  setupUserDataService() {
    // no-op for now
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
  }

  onTileDrop(event: Event) {
    // Cast the generic event to CdkDragDrop<string[]>
    const cdkEvent = event as unknown as CdkDragDrop<string[]>;
    
    // Use the parsed event to move items in array
    moveItemInArray(this.tileOrder, cdkEvent.previousIndex, cdkEvent.currentIndex);
    // Optionally, persist tileOrder to localStorage or service
  }
}
