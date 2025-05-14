import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService } from './sound.service';
import { AudioValidationService, SoundHelperService } from './legacy-sound-services';
import { EnsureAudioFilesService } from './ensure-audio-files.service';

/**
 * Module for sound-related services and components
 * 
 * Provides:
 * - SoundService: Modern comprehensive sound management with custom categories and paths
 * - EnsureAudioFilesService: Audio validation and fallback system
 * - Legacy compatibility services for backwards compatibility
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    SoundService,
    EnsureAudioFilesService, // Core audio validation service
    AudioValidationService,  // Legacy compatibility service
    SoundHelperService       // Legacy compatibility service
  ]
})
export class SoundModule { }
