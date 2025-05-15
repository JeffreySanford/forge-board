import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { LoggerService } from '../../services/logger.service';
import { 
  AudioSystemStatus, 
  AudioValidationResult, 
  SoundSettings,
  DEFAULT_SOUND_CATEGORIES
} from './sound-system';

// Re-export interfaces from sound-system for consumers
export { AudioSystemStatus, SoundSettings } from './sound-system';

/**
 * Sound types available in the system
 * These correspond to the default MP3 files in assets/sounds/typewriter/
 */
export enum SoundType {
  KEYSTRIKE = 'keystrike',
  DING = 'ding',
  RETURN = 'return',
  AMBIENT = 'ambient'
}

/**
 * A unified service for handling all audio functionality:
 * - Validating audio files exist or creating fallbacks
 * - Managing sound elements and playback
 * - Handling volume, muting, and enabled state
 * 
 * Designed to be compliant with browser autoplay policies.
 */
@Injectable({
  providedIn: 'root'
})
export class SoundService implements OnDestroy {
  // Audio elements indexed by sound type
  private soundElements = new Map<string, HTMLAudioElement>();
  
  // Cleanup subject for managing subscriptions
  private destroySubject = new Subject<void>();
  
  // Status of the audio system
  private statusSubject = new BehaviorSubject<AudioSystemStatus>({
    initialized: false,
    validationComplete: false,
    audioReady: false,
    playbackAllowed: false,
    fileResults: [],
    lastValidation: null
  });
  
  // User settings for sound playback
  private settings$ = new BehaviorSubject<SoundSettings>({
    enabled: false,
    volume: 0.5,
    muted: false
  });
  
  // Fallback sounds as base64 for when files are missing
  private fallbackBase64Map = new Map<string, string>();
  
  // Track initialization state
  private initialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  
  // Observable for the current status
  public status$ = this.statusSubject.asObservable();
  // Sound categories configuration
  private soundCategories: Record<string, string[]> = {};
  
  // Base path for sound files
  private baseSoundPath = 'assets/sounds';
  constructor(
    private ngZone: NgZone,
    private logger: LoggerService
  ) {
    // Initialize sound categories from DEFAULT_SOUND_CATEGORIES
    this.soundCategories = { ...DEFAULT_SOUND_CATEGORIES };
    
    // Initialize fallback sound data
    this.initializeFallbacks();
    
    this.logger.debug('[Sound] Service initialized with default sound categories');
  }
  
  ngOnDestroy(): void {
    // Complete subjects
    this.destroySubject.next();
    this.destroySubject.complete();
    this.statusSubject.complete();
    
    // Clean up audio elements
    this.soundElements.forEach((element) => {
      element.pause();
      element.src = '';
      element.load();
    });
    this.soundElements.clear();
  }
  
  /**
   * Set the base path for all sound files
   * @param path Base path for sounds (default is 'assets/sounds')
   */
  setBaseSoundPath(path: string): void {
    this.baseSoundPath = path;
    this.logger.debug(`[Sound] Base sound path set to: ${path}`);
  }
  
  /**
   * Register a category of sound files to be loaded
   * @param category The category name (e.g., 'typewriter', 'ui', etc.)
   * @param files Array of filenames to load from this category
   */
  registerSoundCategory(category: string, files: string[]): void {
    this.soundCategories[category] = files;
    this.logger.debug(`[Sound] Registered ${files.length} sounds in category '${category}'`);
  }
  
  /**
   * Clear all registered sound categories
   */
  clearSoundCategories(): void {
    this.soundCategories = {};
    this.logger.debug('[Sound] Cleared all sound categories');
  }
  
  /**
   * Initialize the audio system.
   * Should be called after user interaction to comply with autoplay policies
   * @returns Observable<boolean> True if initialization succeeds
   */
  initialize(): Observable<boolean> {
    const currentStatus = this.statusSubject.getValue();
    
    // Skip if already initialized
    if (currentStatus.initialized) {
      return of(true);
    }

    // Return existing initialization if already in progress
    if (this.initializationPromise) {
      return from(this.initializationPromise);
    }

    this.logger.info('[Sound] Starting sound system initialization');
    
    // Update status to reflect initialization started
    this.statusSubject.next({
      ...currentStatus,
      initialized: true,
    });

    this.initializationPromise = new Promise<boolean>((resolve) => {
      // Run the validation process asynchronously
      from(this.validateAudioFiles()).pipe(
        tap(results => {
          this.logger.info(
            `[Sound] Validated ${results.length} audio files. ` +
            `${results.filter(r => r.exists).length} exist, ` + 
            `${results.filter(r => r.fallbackCreated).length} using fallbacks.`
          );
          
          // Map audio elements for reuse
          results.forEach(result => {
            if (result.element) {
              const key = `${result.category}/${result.filename}`;
              this.soundElements.set(key, result.element);
            }
          });
        }),
        switchMap(results => {
          // Test if audio playback is allowed with the first found audio element
          const testElement = results[0]?.element;
          let playbackAllowed = false;
          
          if (testElement) {
            return from(this.testAudioPlayback(testElement)).pipe(
              map(allowed => {
                playbackAllowed = allowed;
                
                if (allowed) {
                  this.logger.info('[Sound] Autoplay is allowed');
                } else {
                  this.logger.warn('[Sound] Autoplay is blocked - user interaction required');
                }
                
                // Update status with validation results
                const newStatus: AudioSystemStatus = {
                  initialized: true,
                  validationComplete: true,
                  audioReady: results.every(r => r.exists || r.fallbackCreated),
                  playbackAllowed,
                  fileResults: results,
                  lastValidation: new Date()
                };
                
                this.statusSubject.next(newStatus);
                
                // Update settings based on autoplay capability
                const currentSettings = this.settings$.getValue();
                this.settings$.next({
                  ...currentSettings,
                  enabled: playbackAllowed
                });
                
                return true;
              })
            );
          } else {
            // No test element available
            const newStatus: AudioSystemStatus = {
              initialized: true,
              validationComplete: true,
              audioReady: false,
              playbackAllowed: false,
              fileResults: results,
              lastValidation: new Date()
            };
            
            this.statusSubject.next(newStatus);
            return of(false);
          }
        }),
        // Handle any errors during validation
        catchError(error => {
          this.logger.error('[Sound] Audio validation failed:', error);
          
          const errorStatus: AudioSystemStatus = {
            ...currentStatus,
            initialized: true,
            validationComplete: true,
            audioReady: false,
            playbackAllowed: false,
            lastValidation: new Date()
          };
          
          this.statusSubject.next(errorStatus);
          this.initializationPromise = null;
          resolve(false);
          return of(false);
        }),
        // Make sure we're not subscribed multiple times
        takeUntil(this.destroySubject)
      ).subscribe(
        success => {
          this.initialized = true;
          this.initializationPromise = null;
          resolve(success);
        },
        error => {
          this.logger.error('[Sound] Sound system initialization failed', error);
          this.initializationPromise = null;
          resolve(false);
        }
      );
    });

    return from(this.initializationPromise);
  }  /**
   * Play a sound with specified parameters
   * @param type The sound type to play
   * @param volume Optional volume override (0-1)
   * @param category Optional category name (defaults to 'typewriter')
   * @returns Observable that completes when sound starts playing
   */
  playSound(type: SoundType | string, volume?: number, category = 'typewriter'): Observable<boolean> {
    // Skip if not initialized
    if (!this.initialized) {
      this.logger.warn('[Sound] Sound system not initialized. Call initialize() first.');
      return of(false);
    }

    // Get current settings
    const settings = this.settings$.getValue();
    if (!settings.enabled || settings.muted) {
      return of(false);
    }

    // Get appropriate audio element
    const soundElement = this.getAudioElement(type, category);
    if (!soundElement) {
      this.logger.warn(`[Sound] No sound element available for ${category}/${type}`);
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
          this.logger.error(`[Sound] Error playing ${category}/${type} sound:`, err);
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
  private createAudioElement(category: string, filename: string): HTMLAudioElement {
    const audio = new Audio();
    
    // Add error handling for missing audio files
    audio.addEventListener('error', () => {
      this.logger.warn(`[Sound] Sound file for ${category}/${filename} not found. Using fallback.`);
      this.applyFallbackSound(audio, filename);
    });

    // Set source based on category and filename using the base path
    audio.src = `${this.baseSoundPath}/${category}/${filename}`;
    audio.preload = 'auto';
    
    // Start loading the audio
    audio.load();
    
    return audio;
  }

  /**
   * Apply fallback sound when primary sound fails to load
   */
  private applyFallbackSound(audio: HTMLAudioElement, filename: string): void {
    const soundType = filename.replace('.mp3', '') as SoundType;
    const fallbackBase64 = this.fallbackBase64Map.get(soundType);
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
    const silentMP3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rIC';
    
    // Add fallbacks for each sound type
    for (const type of Object.values(SoundType)) {
      this.fallbackBase64Map.set(type, silentMP3);
    }
  }

  /**
   * Test if an audio element can play properly
   */
  private async testAudioPlayback(element: HTMLAudioElement): Promise<boolean> {
    try {
      // Try to play the audio
      await element.play();
      
      // Immediately pause it
      element.pause();
      element.currentTime = 0;
      
      return true;
    } catch (error) {
      // Autoplay was prevented
      return false;
    }
  }
  /**
   * Validate audio files, creating elements for each one
   * @returns Promise<AudioValidationResult[]> Validation results
   */
  private async validateAudioFiles(): Promise<AudioValidationResult[]> {
    const results: AudioValidationResult[] = [];
    
    // Process each category of sounds
    for (const [category, files] of Object.entries(this.soundCategories)) {
      for (const filename of files) {
        // Create element to test if the file loads
        const element = this.createAudioElement(category, filename);
        const fileKey = `${category}/${filename}`;
        
        // Wait for the file to load or error out
        const result = await new Promise<AudioValidationResult>(resolve => {
          // Set a timeout to handle cases where the browser never fires events
          const timeout = setTimeout(() => {
            resolve({
              category,
              filename,
              exists: false,
              fallbackCreated: true,
              element
            });
          }, 2000);
          
          // Listen for successful load
          element.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve({
              category,
              filename,
              exists: true,
              fallbackCreated: false,
              element
            });
          }, { once: true });
          
          // Listen for load error
          element.addEventListener('error', () => {
            clearTimeout(timeout);
            
            // Apply fallback and consider it created
            this.applyFallbackSound(element, filename);
            
            resolve({
              category,
              filename,
              exists: false,
              fallbackCreated: true,
              element
            });
          }, { once: true });
        });
        
        // Store the element for reuse
        this.soundElements.set(fileKey, element);
        
        // Add to results
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Revalidate audio files - useful if new audio files were added during runtime
   */
  revalidate(): Observable<AudioSystemStatus> {
    this.logger.debug('[Sound] Revalidating audio files');
    return this.initialize().pipe(
      switchMap(() => this.status$),
      shareReplay(1)
    );
  }  /**
   * Get an audio element by sound type
   * @param type Sound type from SoundType enum or string sound name
   * @param category Optional category name (defaults to 'typewriter')
   * @returns HTMLAudioElement or null if not available
   */
  getAudioElement(type: SoundType | string, category = 'typewriter'): HTMLAudioElement | null {
    // Handle both SoundType enum and plain strings (for custom sounds)
    const soundFile = type.endsWith('.mp3') ? type : `${type}.mp3`;
    const key = `${category}/${soundFile}`;
    return this.soundElements.get(key) || null;
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
    return this.revalidate().pipe(
      map(status => {
        this.logger.info(`[Sound] Audio system health check: ${status.audioReady ? 'HEALTHY' : 'ISSUES FOUND'}`);
        
        if (!status.audioReady) {
          // If issues were found, log them
          status.fileResults.forEach(result => {
            if (!result.exists) {
              this.logger.warn(`[Sound] Audio file missing: ${result.category}/${result.filename}, using fallback`);
            }
          });
        }
        
        return status.audioReady;
      })
    );
  }
    /**
   * Register a sound element directly from the DOM
   * Useful when components use @ViewChild to access audio elements
   * @param type Sound type or sound filename
   * @param element HTMLAudioElement to register
   * @param category Optional category name (defaults to 'typewriter')
   */
  registerExistingSoundElement(type: SoundType | string, element: HTMLAudioElement, category = 'typewriter'): void {
    if (element) {
      // Handle both SoundType enum and plain strings (for custom sounds)
      const soundFile = type.endsWith('.mp3') ? type : `${type}.mp3`;
      const key = `${category}/${soundFile}`;
      
      this.logger.debug(`[Sound] Registering existing sound element for ${category}/${type}`);
      this.soundElements.set(key, element);
    }
  }
}
