/**
 * Sound system types and interfaces for ForgeBoard
 * Core definitions for the sound system
 */

// Re-export SoundType from sound.service for easy access
export { SoundType } from './sound.service';

// Define required sound categories - accessible from browser context

/**
 * Sound settings configuration
 */
export interface SoundSettings {
  enabled: boolean;
  volume: number;
  muted: boolean;
}

/**
 * Sound category configuration
 */
export interface SoundCategory {
  path: string;
  files: string[];
}

/**
 * Result of audio file validation
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
 * Overall status of the audio system
 */
export interface AudioSystemStatus {
  initialized: boolean;
  validationComplete: boolean;
  audioReady: boolean;
  playbackAllowed: boolean;
  fileResults: AudioValidationResult[];
  lastValidation: Date | null;
}

// Define default sound categories and their required files
export const DEFAULT_SOUND_CATEGORIES: Record<string, string[]> = {
  typewriter: ['keystrike.mp3', 'ding.mp3', 'return.mp3', 'ambient.mp3'],
};

// This export is needed by legacy code
export const REQUIRED_SOUNDS: Record<string, string[]> = {
  typewriter: ['keystrike.mp3', 'ding.mp3', 'return.mp3', 'ambient.mp3'],
  ui: ['click.mp3', 'hover.mp3', 'alert.mp3']
};

/**
 * Browser-compatible version of utility functions for sound files
 */
export class SoundFileUtils {
  /**
   * Check if a file exists by sending a HEAD request
   * Browser-compatible version of fs.existsSync
   */
  static async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get the full URL for a sound file
   */
  static getSoundUrl(basePath: string, category: string, filename: string): string {
    return `${basePath}/${category}/${filename}`;
  }
  
  /**
   * Create a silent MP3 fallback from base64
   */  static createSilentAudio(): HTMLAudioElement {
    // Minimal silent MP3 as base64
    const silentMP3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rIC';
    
    const audio = new Audio();
    audio.src = silentMP3;
    audio.load();
    return audio;
  }
  
  /**
   * Check for required sounds in browser context
   * @param baseUrl The base URL for sound files
   * @returns Promise resolving to a boolean indicating if all sounds exist
   */
  static async checkRequiredSounds(baseUrl: string): Promise<boolean> {
    let allFilesExist = true;
    
    for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
      for (const file of files) {
        const url = SoundFileUtils.getSoundUrl(baseUrl, category, file);
        const exists = await SoundFileUtils.fileExists(url);
        
        if (!exists) {
          console.warn(`Missing sound file: ${url}`);
          allFilesExist = false;
        }
      }
    }
    
    return allFilesExist;
  }
}
