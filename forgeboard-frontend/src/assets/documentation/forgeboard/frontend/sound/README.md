# ForgeBoard Sound System
*Last Updated: May 13, 2025*

This directory contains sound assets used by the ForgeBoard application for its typewriter-like interactive elements and UI sound effects.

## Sound Directory Structure

Sounds in ForgeBoard are organized by category folders:

```
assets/
  sounds/
    typewriter/    # Default sound category for typewriter effects
      keystrike.mp3
      ding.mp3
      return.mp3
      ambient.mp3
    ui/            # UI interaction sounds
      click.mp3
      hover.mp3
      alert.mp3
    [custom]/      # Additional custom sound categories can be added
```

## Required Sound Files

The following sound files are required for core application functionality:

| Category | File | Description |
|----------|------|-------------|
| typewriter | `keystrike.mp3` | Played when a character is typed |
| typewriter | `ding.mp3` | Played at the end of a typed line (bell sound) |
| typewriter | `return.mp3` | Played during carriage return actions |
| typewriter | `ambient.mp3` | Optional background ambient sound |
| ui | `click.mp3` | UI button click feedback |
| ui | `hover.mp3` | UI hover interaction feedback |
| ui | `alert.mp3` | UI notification sound |

## Obtaining Sound Files

The application provides two methods for obtaining the necessary sound files:

### 1. Automatic Download (Recommended)

Run the provided script to download sound files from Freesound.org:

```bash
cd forgeboard-frontend
node scripts/download-sounds.js
```

This requires a Freesound API key in your `.env` file:
```
FREESOUND_API_KEY=your_key_here
```

### 2. Manual Download

If the automatic download fails or you prefer custom sounds:
- Visit [Freesound.org](https://freesound.org)
- Search for appropriate sounds (typewriter, UI clicks, etc.)
- Download and rename files to match the required filenames
- Place them in their respective category folders

## Fallback Mechanism

The ForgeBoard sound system includes a robust fallback mechanism that creates silent audio files if required sound files are missing. This ensures the application functions properly even without sound assets.

The system will:
1. Check for all required sound files at startup
2. Generate silent fallbacks for any missing files
3. Log information about missing files to the console

## Testing & Verification

To verify that all required sound files are present and fallbacks are working:

```bash
# Run the E2E test for the sound system
npx nx e2e forgeboard-frontend-e2e --test-file=sound-system.spec.ts
```

This test will:
- Validate the existence of all required sound files
- Create silent fallbacks if needed
- Update the sound database with file status
- Verify the sound system functions correctly in the application

## License Information

Sound files downloaded from Freesound.org may have specific licenses. Please review the license for each sound on its Freesound page before using the application in a commercial context.

## Additional Documentation

For detailed information on using the sound system in your components, see:
- [Sound System Usage Guide](./README-USAGE.md)
- [Core Sound System Documentation](../../app/core/sounds/README.md)
