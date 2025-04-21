# ForgeBoard Sound System

## Overview
This directory contains scripts and sound files for the ForgeBoard application's audio effects, including the typewriter animation.

## Quick Start

### 1. Download Sound Files
```bash
node download-sounds.js
```
This script will fetch up to three alternatives for each sound (key strike, ding, return, ambient) from Freesound.org and save them as `keystrike.mp3`, `keystrike-alternative-1.mp3`, etc.

### 2. Use the Sounds in the App
The application will automatically use `keystrike.mp3` and `ding.mp3` for the typewriter effect. You can swap in alternatives by renaming files if you want to change the sound.

### 3. Restart Your Angular Development Server
After updating sound files, restart your dev server to ensure the new files are loaded.

## Available Sound Themes

- **typewriter** - Classic manual typewriter sounds (default)
- **mechanical** - Mechanical keyboard sounds (future support)
- **computer** - Modern computer keyboard sounds (future support)
- **vintage** - Vintage electric typewriter (future support)

## File Structure

- `keystrike.mp3`, `keystrike-alternative-1.mp3`, ...
- `ding.mp3`, `ding-alternative-1.mp3`, ...
- `return.mp3`, `ambient.mp3`, etc.
- `download-sounds.js` - Automated download script

## Missing Sound Files

If the application cannot find the required sound files, it will use a silent fallback. To enable real typewriter sounds, run the download script above.

## Manual Setup (Advanced)

You may manually download and place sound files in this directory. The application expects:

- `keystrike.mp3`
- `ding.mp3`
- `return.mp3`
- `ambient.mp3` (optional)

## Troubleshooting

- If you hear the wrong sounds, rerun the download script.
- For custom themes, swap in alternative files as needed.

---
