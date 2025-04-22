# ForgeBoard Sound System

This directory contains sound assets used by the ForgeBoard application for its typewriter-like interactive elements.

## Sound Files

The following sound files are required for the application to function properly:

- `typewriter/keystrike.mp3`: Played when a character is typed (during animations)
- `typewriter/ding.mp3`: Played at the end of a typed line (terminal bell sound)
- `typewriter/return.mp3`: Played during carriage return actions
- `typewriter/ambient.mp3`: Optional background ambient sound

## Obtaining Sound Files

You have two options for obtaining the necessary sound files:

1. **Automatic Download**: Run the provided script to download sound files from Freesound.org:
   ```
   node download-sounds.js
   ```
   This requires a Freesound API key in your .env file: `FREESOUND_API_KEY=your_key_here`

2. **Manual Download**: If the automatic download fails or you prefer specific sounds:
   - Visit [Freesound.org](https://freesound.org)
   - Search for appropriate typewriter sounds
   - Download and rename them to match the required filenames

## Fallback Mechanism

The application includes a fallback mechanism that will create silent audio files if the required sound files are missing. This ensures the application functions even without the sound assets.

## Testing & Verification

To verify that all required sound files are present and fallbacks are working, run the E2E test:
```bash
npx nx e2e forgeboard-frontend-e2e --test-file=sound-system.spec.ts
```
This will check for missing files and create silent fallbacks if needed.

## License Information

Sound files downloaded from Freesound.org may have specific licenses. Please review the license for each sound on its Freesound page if you plan to use this application in a commercial context.

---
**Note:** The sound system is tightly integrated with the UI and respects user preferences (mute, volume). All audio elements include error handling and fallback logic as described in [README-USAGE.md](./README-USAGE.md).
