/**
 * Audio file validation and fallback system for ForgeBoard
 * Browser-compatible version of the sound system utility
 */

import { Injectable } from '@angular/core';

// Define sound categories and their required files
export const REQUIRED_SOUNDS: Record<string, string[]> = {
  typewriter: ['keystrike.mp3', 'ding.mp3', 'return.mp3', 'ambient.mp3'],
};

// Minimal valid MP3 with silence as fallback sound (base64 encoded)
const SILENT_MP3_BASE64 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rICDECOXb/1PYh6kM3JyvP/+9tf1/+YAYcHwtd/////E38P//3//94GoEEQBGg7ASGAQnAyeMoA//tUxAUACzgJogAAAAAAAQRQgAAAAQDAYFg0OFhJGiwkiyKJs0XZFpMgkpAIBAIBAMZhyfJGjRo2aezpdXO6XS6SvS6vV3o1Ot1dqtXo9G//////jw3RoiDC6VavV6vV7d2aAcBAQCAQ';

/**
 * Results of audio file validation
 */
export interface AudioValidationResult {
  category: string;
  filename: string;
  exists: boolean;
  fallbackCreated: boolean;
  element?: HTMLAudioElement;
  error?: string;
}

/**
 * Service for audio file validation
 * Handles checking, creating fallbacks, and testing audio playback
 */
@Injectable({
  providedIn: 'root'
})
export class EnsureAudioFilesService {
  /**
   * Check if an audio file exists by attempting to load it
   */
  checkAudioFileExists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();
      let resolved = false;
      
      // Success - file exists
      audio.addEventListener('canplaythrough', () => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      });
      
      // Failure - file doesn't exist or can't be played
      audio.addEventListener('error', () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });
      
      // Set timeout in case neither event fires
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 2000);
      
      audio.src = path;
      audio.load();
    });
  }

  /**
   * Create AudioElement with fallback for a sound file
   */
  createAudioElement(category: string, filename: string): HTMLAudioElement {
    const audio = new Audio();
    const path = `assets/sounds/${category}/${filename}`;
    audio.src = path;
    
    // Set up error handler to use fallback
    audio.addEventListener('error', () => {
      console.warn(`Audio file not found: ${path}, using silent fallback`);
      audio.src = SILENT_MP3_BASE64;
      audio.load();
    });
    
    audio.load();
    return audio;
  }

  /**
   * Test if audio system is working (if autoplay is allowed)
   */
  async testAudioPlayback(audio: HTMLAudioElement): Promise<boolean> {
    try {
      audio.volume = 0.01; // Very low volume for test
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      return true;
    } catch (error) {
      console.warn('Audio playback test failed. User interaction may be required:', error);
      return false;
    }
  }

  /**
   * Validate all required sounds and create fallbacks as needed
   */
  async validateAudioFiles(): Promise<AudioValidationResult[]> {
    const results: AudioValidationResult[] = [];
    
    for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
      for (const filename of files) {
        const path = `assets/sounds/${category}/${filename}`;
        try {
          const exists = await this.checkAudioFileExists(path);
          const element = this.createAudioElement(category, filename);
          
          results.push({
            category,
            filename,
            exists,
            fallbackCreated: !exists,
            element
          });
        } catch (error) {
          results.push({
            category,
            filename,
            exists: false,
            fallbackCreated: true,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    return results;
  }
}
