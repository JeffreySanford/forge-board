# ForgeBoard Typewriter Sound System

## Usage

- Place required sound files in this directory:
  - `keystrike.mp3` (key press)
  - `ding.mp3` (carriage return)
  - `return.mp3` (slide, optional)
  - `ambient.mp3` (background, optional)
- Use `download-sounds.js` to fetch authentic sounds from Freesound.org.
- The app uses these files for typewriter animation and sound effects.

## Quick Start

```bash
node download-sounds.js
```

## Troubleshooting

- If sounds are missing or incorrect, rerun the download script.
- Browser may require user interaction before playing audio.
- For silent fallback, ensure files are present but empty.

## Advanced

- Swap in alternative files by renaming.
- Test sound system with `test-sound-system.js`.

---
