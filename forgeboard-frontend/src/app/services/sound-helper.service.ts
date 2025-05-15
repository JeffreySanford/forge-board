import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, from, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AudioValidationService } from '../core/sounds/legacy-sound-services';
import { LoggerService } from './logger.service';

// Import and re-export SoundType for backward compatibility
import { SoundType } from '../core/sounds/sound.service';
export { SoundType };

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  muted: boolean;
}

/**
 * Service for managing sound playback throughout the application
 * 
 * DEPRECATED: This service is now a wrapper around the core SoundService.
 * For new code, please use the SoundService directly.
 * 
 * Note: For more information on obtaining sound files, see:
 * - assets/sounds/README.md (General information)
 * - assets/sounds/README-USAGE.md (Usage guidelines)
 */
@Injectable({
  providedIn: 'root'
})
export class SoundHelperService implements OnDestroy {
  // Legacy service properties used by existing code
  private soundElements: Map<SoundType, HTMLAudioElement> = new Map();
  private settings$ = new BehaviorSubject<SoundSettings>({
    enabled: false,
    volume: 0.5,
    muted: false
  });
  private fallbackBase64Map: Map<SoundType, string> = new Map();
  private initialized = false;
  private subscriptions = new Subscription();  
  private initializationPromise: Promise<boolean> | null = null;

  constructor(
    private ngZone: NgZone,
    private audioValidationService: AudioValidationService,
    private logger: LoggerService
  ) {
    // Initialize fallback sounds as base64 strings
    this.initializeFallbacks();
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.unsubscribe();
    
    // Clean up audio elements
    this.soundElements.forEach((element) => {
      element.pause();
      element.src = '';
      element.load();
    });
    this.soundElements.clear();
  }
  /**
   * Initialize the sound system
   * Should be called after user interaction to comply with autoplay policies
   * Uses AudioValidationService to ensure all audio files are available or have fallbacks
   */
  initialize(): Observable<boolean> {
    if (this.initialized) {
      return of(true);
    }

    // If already initializing, return the existing promise as an observable
    if (this.initializationPromise) {
      return from(this.initializationPromise);
    }

    this.logger.info('[SoundHelper] Starting sound system initialization');
    
    // Create a new initialization process using the validation service
    this.initializationPromise = new Promise<boolean>((resolve) => {
      // Initialize the audio validation service first
      this.audioValidationService.initialize().subscribe(
        status => {
          // Get validated audio elements from the audio validation service
          if (status.audioReady) {
            // Register each sound element from the validation service
            for (const soundType of Object.values(SoundType)) {
              const audioElement = this.audioValidationService.getAudioElement(soundType);
              if (audioElement) {
                this.soundElements.set(soundType, audioElement);
                this.logger.debug(`[SoundHelper] Registered audio element for ${soundType}`);
              } else {
                // If no validated element exists, create a new one
                this.createAudioElement(soundType);
                this.logger.debug(`[SoundHelper] Created fallback audio element for ${soundType}`);
              }
            }

            this.initialized = true;
            this.logger.info(`[SoundHelper] Sound system initialization successful. Playback allowed: ${status.playbackAllowed}`);
            
            // Update settings based on autoplay capability
            const currentSettings = this.settings$.getValue();
            this.settings$.next({
              ...currentSettings,
              enabled: status.playbackAllowed
            });
            
            resolve(true);
          } else {
            // Fallback to original initialization logic
            for (const soundType of Object.values(SoundType)) {
              this.createAudioElement(soundType);
            }
            
            // Wait for the next event loop to ensure elements are created
            setTimeout(() => {
              // Check if all audio elements are properly loaded
              const allSoundsReady = Array.from(this.soundElements.values()).every(
                element => element.readyState >= 2 // HAVE_CURRENT_DATA or better
              );

              this.logger.info(`[SoundHelper] Sound system initialization ${allSoundsReady ? 'successful' : 'partial'}`);
              this.initialized = true;
              resolve(true);
            }, 100);
          }
          
          this.initializationPromise = null;
        },
        error => {
          this.logger.error('[SoundHelper] Sound system initialization failed', error);
          // Fallback to default initialization
          for (const soundType of Object.values(SoundType)) {
            this.createAudioElement(soundType);
          }
          this.initialized = true;
          resolve(false);
          this.initializationPromise = null;
        }
      );
    });

    return from(this.initializationPromise);
  }

  /**
   * Play a sound with specified parameters
   * @param type The sound type to play
   * @param volume Optional volume override (0-1)
   * @returns Observable that completes when sound starts playing
   */
  playSound(type: SoundType, volume?: number): Observable<boolean> {
    if (!this.initialized) {
      console.warn('[SoundHelper] Sound system not initialized. Call initialize() first.');
      return of(false);
    }

    const settings = this.settings$.getValue();
    if (!settings.enabled || settings.muted) {
      return of(false);
    }

    const soundElement = this.soundElements.get(type);
    if (!soundElement) {
      return of(false);
    }

    // Run in the Angular zone to ensure change detection works
    return this.ngZone.run(() => {
      // Set volume - either from parameter or from settings
      const effectiveVolume = volume !== undefined ? volume : settings.volume;
      soundElement.volume = effectiveVolume;
      
      // Reset playback position
      soundElement.currentTime = 0;
      
      // Play the sound with error handling
      return from(soundElement.play()).pipe(
        // Map any successful result to true
        map(() => true),
        catchError(err => {
          console.error(`[SoundHelper] Error playing ${type} sound:`, err);
          return of(false);
        })
      );
    });
  }

  /**
   * Set sound system enabled state
   */
  setEnabled(enabled: boolean): void {
    const currentSettings = this.settings$.getValue();
    this.settings$.next({
      ...currentSettings,
      enabled
    });
  }

  /**
   * Set volume for all sounds
   * @param volume Volume level (0-1)
   */
  setVolume(volume: number): void {
    volume = Math.max(0, Math.min(1, volume));
    const currentSettings = this.settings$.getValue();
    this.settings$.next({
      ...currentSettings,
      volume
    });
  }

  /**
   * Set muted state for all sounds
   */
  setMuted(muted: boolean): void {
    const currentSettings = this.settings$.getValue();
    this.settings$.next({
      ...currentSettings,
      muted
    });
  }

  /**
   * Get current sound settings
   */
  getSettings(): Observable<SoundSettings> {
    return this.settings$.asObservable();
  }

  /**
   * Create an audio element for a specific sound type
   */
  private createAudioElement(type: SoundType): void {
    const audio = new Audio();
    
    // Add error handling for missing audio files
    audio.addEventListener('error', () => {
      console.warn(`[SoundHelper] Sound file for ${type} not found. Using fallback.`);
      this.applyFallbackSound(audio, type);
    });

    // Set source based on type
    audio.src = `assets/sounds/typewriter/${type}.mp3`;
    audio.preload = 'auto';
    
    // Store element in map
    this.soundElements.set(type, audio);
    
    // Start loading the audio
    audio.load();
  }

  /**
   * Apply fallback sound when primary sound fails to load
   */
  private applyFallbackSound(audio: HTMLAudioElement, type: SoundType): void {
    const fallbackBase64 = this.fallbackBase64Map.get(type);
    if (fallbackBase64) {
      audio.src = fallbackBase64;
      audio.load();
    }
  }

  /**
   * Initialize fallback sounds as base64 strings
   */
  private initializeFallbacks(): void {
    // Minimal silent MP3 in base64 format to prevent errors
    const silentMP3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rICDECOXb/1PYh6kM3JyvP/+9tf1/+YAYcHwtd/////E38P//3//94GoEEQBGg7ASGA';
    
    // Add fallbacks for each sound type
    this.fallbackBase64Map.set(SoundType.KEYSTRIKE, silentMP3);
    this.fallbackBase64Map.set(SoundType.DING, silentMP3);
    this.fallbackBase64Map.set(SoundType.RETURN, silentMP3);
    this.fallbackBase64Map.set(SoundType.AMBIENT, silentMP3);
  }

  /**
   * Test if all audio elements can play properly
   * @returns Observable of boolean success status
   */
  testAudioPlayback(): Observable<boolean> {
    if (!this.initialized) {
      return of(false);
    }

    const testElement = this.soundElements.get(SoundType.KEYSTRIKE);
    if (!testElement) {
      return of(false);
    }

    return from(testElement.play()).pipe(
      tap(() => {
        // Immediately pause the test sound
        testElement.pause();
        testElement.currentTime = 0;
      }),
      // Map successful playback to true
      map(() => true),
      catchError(() => {
        console.warn('[SoundHelper] Audio test failed - browser may require user interaction first');
        return of(false);
      })
    );
  }
    /**
   * Register a sound element directly from the DOM
   * Useful when components use @ViewChild to access audio elements
   */
  registerExistingSoundElement(type: SoundType, element: HTMLAudioElement): void {
    if (element) {
      this.logger.debug(`[SoundHelper] Registering existing sound element for ${type}`);
      this.soundElements.set(type, element);
    }
  }
  
  /**
   * Verify audio system health and revalidate if needed
   * @returns Observable with status of audio system
   */
  verifyAudioSystemHealth(): Observable<boolean> {
    // If not initialized, initialize first
    if (!this.initialized) {
      return this.initialize();
    }
    
    // Otherwise, revalidate through the audio validation service
    return this.audioValidationService.revalidate().pipe(
      map(status => {
        this.logger.info(`[SoundHelper] Audio system health check: ${status.audioReady ? 'HEALTHY' : 'ISSUES FOUND'}`);
        
        if (!status.audioReady) {
          // If issues were found, log them
          status.fileResults.forEach(result => {
            if (!result.exists) {
              this.logger.warn(`[SoundHelper] Audio file missing: ${result.category}/${result.filename}, using fallback`);
            }
          });
        }
        
        return status.audioReady;
      })
    );
  }
}
