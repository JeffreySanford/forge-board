import * as fs from 'fs';
import * as path from 'path';

/**
 * Sound system utility for ForgeBoard
 * Handles checking, creating, and managing sound files
 */

// Define sound categories and their required files
export const REQUIRED_SOUNDS: Record<string, string[]> = {
  typewriter: ['keystrike.mp3', 'ding.mp3', 'return.mp3', 'ambient.mp3'],
};

// Minimal valid MP3 with silence as fallback sound
const SILENT_MP3_BASE64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAADkKYYwGMAAAAAAAAAAAAAAAAA//tUxAAACwwFsQAAAAAAANgLYgAAATZNAR4CDCASBBGQR+k2c//4CPov/rICDECOXb/1PYh6kM3JyvP/+9tf1/+YAYcHwtd/////E38P//3//94GoEEQBGg7ASGAQnAyeMoA//tUxAUACzgJogAAAAAAAQRQgAAAAQDAYFg0OFhJGiwkiyKJs0XZFpMgkpAIBAIBAMZhyfJGjRo2aezpdXO6XS6SvS6vV3o1Ot1dqtXo9G//////jw3RoiDC6VavV6vV7d2aAcBAQCAQ';

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Check which required sound files are missing
 */
export function checkMissingFiles(soundDir: string, files: string[]): string[] {
  return files.filter(file => !fs.existsSync(path.join(soundDir, file)));
}

/**
 * Create silent fallback sound files for missing required sounds
 */
export function createSilentFallbacks(basePath: string, category: string, files: string[]): void {
  const buffer = Buffer.from(SILENT_MP3_BASE64, 'base64');
  const soundDir = path.join(basePath, category);
  
  // Create directory if needed
  ensureDirectoryExists(soundDir);
  
  // Create silent file for each missing file
  for (const filename of files) {
    const filePath = path.join(soundDir, filename);
    
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, buffer);
        console.log(`Created silent fallback for ${category}/${filename}`);
      } catch (err) {
        console.error(`Error creating silent fallback for ${filename}:`, err);
      }
    }
  }
}

/**
 * Check for all required sound files and create fallbacks if needed
 */
export function ensureSoundFiles(basePath: string = path.resolve(__dirname)): boolean {
  let allFilesExist = true;
  
  for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
    const soundDir = path.join(basePath, category);
    console.log(`Checking ${category} sounds in: ${soundDir}`);
    
    // Create directory if needed
    ensureDirectoryExists(soundDir);
    
    // Check for missing files
    const missingFiles = checkMissingFiles(soundDir, files);
    console.log(`Found ${files.length - missingFiles.length}/${files.length} required ${category} files`);
    
    // Create fallbacks for missing files
    if (missingFiles.length > 0) {
      console.log(`Creating silent fallbacks for missing ${category} files:`, missingFiles);
      createSilentFallbacks(basePath, category, missingFiles);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Run the sound system check and setup
 * This can be called directly from the command line: node sound-system.js
 */
if (require.main === module) {
  const result = ensureSoundFiles();
  console.log(result ? '✓ All sound files exist' : '✓ Created fallback sounds for missing files');
}
