/**
 * Sound system utilities for ForgeBoard
 * Used by both the application and E2E tests to ensure sound files exist
 */

import * as fs from 'fs';
import * as path from 'path';

// Define required sound files by category
export const REQUIRED_SOUNDS: Record<string, string[]> = {
  typewriter: ['keystrike.mp3', 'ding.mp3', 'return.mp3'],
};

// Base64 minimal silent MP3 as fallback
const SILENT_MP3_BASE64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rIC';

/**
 * Ensure all required sound files exist, creating fallbacks if needed
 * @param baseDir Base directory for sound files
 * @returns true if all files exist, false if fallbacks were created
 */
export function ensureSoundFiles(baseDir: string): boolean {
  let allExist = true;
  
  for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
    const categoryDir = path.join(baseDir, category);
    
    // Create the category directory if it doesn't exist
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`Created missing directory: ${categoryDir}`);
      allExist = false;
    }
    
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.log(`Creating fallback for missing sound file: ${filePath}`);
        
        // Create a silent fallback file
        const silentMp3Buffer = Buffer.from(SILENT_MP3_BASE64, 'base64');
        fs.writeFileSync(filePath, silentMp3Buffer);
        
        allExist = false;
      }
    }
  }
  
  return allExist;
}

/**
 * Check if required sound files exist
 * @param baseDir Base directory for sound files
 * @returns true if all required files exist, false otherwise
 */
export function checkSoundFiles(baseDir: string): boolean {
  for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
    const categoryDir = path.join(baseDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      return false;
    }
    
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
    }
  }
  
  return true;
}
