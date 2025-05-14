import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { AudioValidationResult } from '../core/sounds/ensure-audio-files.service';
import { EnsureAudioFilesService } from '../core/sounds/ensure-audio-files.service';
import { SoundType } from '../core/sounds/sound.service';

export interface AudioSystemStatus {
  initialized: boolean;
  validationComplete: boolean;
  audioReady: boolean;
  playbackAllowed: boolean;
  fileResults: AudioValidationResult[];
  lastValidation: Date | null;
}

/**
 * Service responsible for validating audio files and ensuring they're ready for use
 * 
 * This service:
 * - Validates audio files exist or creates fallbacks
 * - Checks if audio playback is allowed in the browser
 * - Reports status to the logger service
 * - Makes validation results available to other services
 */
@Injectable({
  providedIn: 'root'
})
export class AudioValidationService implements OnDestroy {
  private audioElements = new Map<string, HTMLAudioElement>();  private destroySubject = new Subject<void>();
  private statusSubject = new BehaviorSubject<AudioSystemStatus>({
    initialized: false,
    validationComplete: false,
    audioReady: false,
    playbackAllowed: false,
    fileResults: [],
    lastValidation: null
  });
  
  // Cached validation result
  private validationResult$: Observable<AudioSystemStatus> | null = null;

  /**
   * Observable that emits the current audio system status
   */
  public status$ = this.statusSubject.asObservable();

  constructor(
    private logger: LoggerService,
    private audioFilesService: EnsureAudioFilesService
  ) {
    // Don't automatically initialize to avoid autoplay issues
    // Initialization should happen after user interaction
  }

  /**
   * Initialize the audio validation system
   * Should be called after user interaction to comply with autoplay policies
   */
  public initialize(): Observable<AudioSystemStatus> {
    const currentStatus = this.statusSubject.getValue();

    // Skip if already initialized
    if (currentStatus.initialized) {
      return of(currentStatus);
    }

    this.logger.debug('[AudioValidation] Initializing audio validation service');
      // Update status to reflect initialization started
    this.statusSubject.next({
      ...currentStatus,
      initialized: true,
    });
    
    // Run the validation process
    return from(this.audioFilesService.validateAudioFiles()).pipe(
      tap(results => {
        this.logger.info(
          `[AudioValidation] Validated ${results.length} audio files. ` +
          `${results.filter(r => r.exists).length} exist, ` + 
          `${results.filter(r => r.fallbackCreated).length} using fallbacks.`
        );
        
        // Map audio elements for reuse
        results.forEach(result => {
          if (result.element) {
            const key = `${result.category}/${result.filename}`;
            this.audioElements.set(key, result.element);
          }
        });
      }),
      switchMap(results => {
        // Test if audio playback is allowed with the first found audio element
        const testElement = results[0]?.element;
        
        if (testElement) {
          return from(this.audioFilesService.testAudioPlayback(testElement)).pipe(
            map(playbackAllowed => {
              if (playbackAllowed) {
                this.logger.info('[AudioValidation] Autoplay is allowed');
              } else {
                this.logger.warn('[AudioValidation] Autoplay is blocked - user interaction required');
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
              return newStatus;
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
          return of(newStatus);
        }
      }),
      // Handle any errors during validation
      catchError(error => {
        this.logger.error('[AudioValidation] Audio validation failed:', error);
        
        const errorStatus: AudioSystemStatus = {
          ...currentStatus,
          initialized: true,
          validationComplete: true,
          audioReady: false,
          playbackAllowed: false,
          lastValidation: new Date()
        };
        
        this.statusSubject.next(errorStatus);
        return of(errorStatus);
      }),
      // Make sure we're not subscribed multiple times
      takeUntil(this.destroySubject),
      // Use the first emitted value
      shareReplay(1)
    );
  }

  /**
   * Get an audio element by sound type, with fallback handling
   * @param type Sound type from SoundType enum
   * @returns HTMLAudioElement or null if not available
   */
  public getAudioElement(type: SoundType): HTMLAudioElement | null {
    const key = `typewriter/${type}.mp3`;
    return this.audioElements.get(key) || null;
  }
  /**
   * Revalidate audio files - useful if new audio files were added during runtime
   */
  public revalidate(): Observable<AudioSystemStatus> {
    this.logger.debug('[AudioValidation] Revalidating audio files');
    // Initialize runs validation from scratch
    return this.initialize();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.statusSubject.complete();
    
    // Clean up audio elements
    this.audioElements.forEach(element => {
      element.pause();
      element.src = '';
      element.remove();
    });
    this.audioElements.clear();
  }
}
