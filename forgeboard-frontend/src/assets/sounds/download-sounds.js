#!/usr/bin/env node

/**
 * Sound download script for ForgeBoard
 * Downloads required sounds from Freesound.org using their API
 * 
 * Requires a Freesound API key in your .env file:
 * FREESOUND_API_KEY=your_key_here
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { ensureDirectoryExists } = require('./sound-system');

// Freesound.org API configuration
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

// Sound ID mappings - these are example IDs from Freesound.org
const SOUND_IDS = {
  'typewriter/keystrike.mp3': '352513',
  'typewriter/ding.mp3': '32935',
  'typewriter/return.mp3': '220751',
  'typewriter/ambient.mp3': '67893'
};

/**
 * Download a file from a URL to a local path
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', err => {
        fs.unlink(outputPath, () => { /* Ignore potential errors during cleanup */ });
        reject(err);
      });
    }).on('error', err => {
      fs.unlink(outputPath, () => { /* Ignore potential errors during cleanup */ });
      reject(err);
    });
  });
}

/**
 * Download a sound from Freesound.org
 */
async function downloadSound(soundId, outputPath) {
  if (!FREESOUND_API_KEY) {
    throw new Error('FREESOUND_API_KEY not found in environment variables');
  }
  
  // First, get the sound info to get the download URL
  const infoUrl = `https://freesound.org/apiv2/sounds/${soundId}/?token=${FREESOUND_API_KEY}`;
  
  return new Promise((resolve, reject) => {
    https.get(infoUrl, response => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', async () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get sound info, status code: ${response.statusCode}`));
          return;
        }
        
        try {
          const soundInfo = JSON.parse(data);
          const downloadUrl = soundInfo.download + `?token=${FREESOUND_API_KEY}`;
          
          await downloadFile(downloadUrl, outputPath);
          console.log(`✓ Downloaded sound: ${outputPath}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', err => {
      reject(err);
    });
  });
}

/**
 * Main function to download all required sounds
 */
async function downloadAllSounds() {
  const basePath = path.resolve(__dirname);
  
  console.log('Starting sound download from Freesound.org...');
  
  if (!FREESOUND_API_KEY) {
    console.error('Error: FREESOUND_API_KEY not found in environment variables.');
    console.error('Please add your Freesound API key to a .env file in the project root:');
    console.error('FREESOUND_API_KEY=your_key_here');
    process.exit(1);
  }
  
  // Download each sound by its ID
  for (const [soundPath, soundId] of Object.entries(SOUND_IDS)) {
    const [category, filename] = soundPath.split('/');
    const outputDir = path.join(basePath, category);
    const outputPath = path.join(outputDir, filename);
    
    // Create directory if it doesn't exist
    ensureDirectoryExists(outputDir);
    
    try {
      await downloadSound(soundId, outputPath);
    } catch (err) {
      console.error(`Error downloading ${soundPath}:`, err.message);
    }
  }
  
  console.log('Sound download complete!');
}

// Run the download if called directly
if (require.main === module) {
  downloadAllSounds().catch(err => {
    console.error('Sound download failed:', err);
    process.exit(1);
  });
}

module.exports = { downloadAllSounds };
