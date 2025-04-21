# Typewriter Sound Effects for ForgeBoard

## Classic Typewriter Simulation
This project simulates a classic manual typewriter with both visual animations and synchronized audio effects:

1. Character-by-character typing animation with cursor movement 
2. Key press sounds for each individual character
3. "Ding" sound effects at the end of each line (carriage return)
4. Slower typing for labels, faster typing for values
5. Subtle background ambient sound (optional)

## Required Sound Files
To properly experience the typewriter effect, add the following audio files to this directory:

- `keystrike.mp3` - Individual keypress sound (primary typing sound)
- `keystrike-alternative-1.mp3`, `keystrike-alternative-2.mp3` - Alternative keypress sounds (for future themes)
- `ding.mp3` - "Ding" sound for carriage return at end of line
- `return.mp3` - Carriage return/line feed sound
- `ambient.mp3` - Background ambient typing room noise (optional)

## Recommended Sound Characteristics

- **keystrike.mp3**: Short (50-100ms), mechanical click sound
- **ding.mp3**: Classic typewriter bell sound (high-pitched "ding")
- **return.mp3**: Mechanical sliding sound with subtle thump at end

## Obtaining Authentic Typewriter Sounds

- Use the provided `download-sounds.js` script to fetch the best available sounds from Freesound.org.
- The script will download up to three alternatives for each sound, named as `keystrike.mp3`, `keystrike-alternative-1.mp3`, etc.
- You can manually select or swap alternatives for custom themes.

## Sound File Setup

1. Run the download script:
   ```bash
   node src/assets/sounds/download-sounds.js
   ```
2. Place the generated files in this directory.
3. Restart the application.

## Browser Audio Permission Note
Modern browsers require user interaction before playing audio. The application initializes audio only after the first user click.

## Sound System Testing

To verify that the sound files are correctly installed and working:

```bash
node src/assets/sounds/test-sound-system.js
```

If you encounter issues, check the browser console for audio-related errors. Some browsers may require user interaction before playing audio.

## Troubleshooting Sound Issues

- If you hear the wrong sounds (e.g., key click for ding sound), delete and redownload the correct sound files:
  ```bash
  node src/assets/sounds/download-sounds.js
  ```
- You can manually download specific sounds from Freesound.org if needed.

## Sound System Files

- `download-sounds.js` - Main script for downloading all typewriter sound categories and alternatives.
- `fix-typewriter-sounds.js` - Utility to fix swapped key/ding sound files (rarely needed).
- `test-sound-system.js` - Script to verify sound file presence and basic playback.

---
