import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SoundService, SoundType } from './sound.service';
import { AudioSystemStatus, SoundSettings } from './sound-system';

/**
 * Legacy compatibility service for AudioValidationService
 * Provides the same API as the old service but delegates to the new SoundService
 * 
 * @deprecated Use SoundService directly instead
 */
@Injectable({
  providedIn: 'root'
})
export class AudioValidationService {
  public status$ = this.soundService.status$;

  constructor(private soundService: SoundService) {}

  initialize(): Observable<AudioSystemStatus> {
    return this.soundService.status$;
  }

  getAudioElement(type: SoundType): HTMLAudioElement | null {
    return this.soundService.getAudioElement(type);
  }

  revalidate(): Observable<AudioSystemStatus> {
    return this.soundService.revalidate();
  }
}

/**
 * Legacy compatibility service for SoundHelperService
 * Provides the same API as the old service but delegates to the new SoundService
 * 
 * @deprecated Use SoundService directly instead
 */
@Injectable({
  providedIn: 'root'
})
export class SoundHelperService {
  constructor(private soundService: SoundService) {}

  initialize(): Observable<boolean> {
    return this.soundService.initialize();
  }

  playSound(type: SoundType, volume?: number): Observable<boolean> {
    return this.soundService.playSound(type, volume);
  }

  setEnabled(enabled: boolean): void {
    this.soundService.setEnabled(enabled);
  }

  setVolume(volume: number): void {
    this.soundService.setVolume(volume);
  }

  setMuted(muted: boolean): void {
    this.soundService.setMuted(muted);
  }
  getSettings(): Observable<SoundSettings> {
    return this.soundService.getSettings();
  }

  testAudioPlayback(): Observable<boolean> {
    return this.soundService.verifyAudioSystemHealth();
  }

  registerExistingSoundElement(type: SoundType, element: HTMLAudioElement): void {
    this.soundService.registerExistingSoundElement(type, element);
  }

  verifyAudioSystemHealth(): Observable<boolean> {
    return this.soundService.verifyAudioSystemHealth();
  }
}

/**
 * Re-export SoundType for backward compatibility
 * @deprecated Import from sound.service.ts directly
 */
export { SoundType } from './sound.service';
