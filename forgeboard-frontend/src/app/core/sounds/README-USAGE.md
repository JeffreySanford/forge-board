# Using Sound in ForgeBoard

ForgeBoard uses a typewriter-inspired audio system to enhance the UI experience. This guide explains how to properly implement sound in your components.

## Integration Steps

1. **Add Audio Elements**  
   In your component template:
   ```html
   <audio #keyStrikeSound preload="auto" src="assets/sounds/typewriter/keystrike.mp3"></audio>
   <audio #dingSound preload="auto" src="assets/sounds/typewriter/ding.mp3"></audio>
   ```

2. **Reference in Component**  
   In your component class:
   ```typescript
   @ViewChild('keyStrikeSound') keyStrikeSound!: ElementRef<HTMLAudioElement>;
   @ViewChild('dingSound') dingSound!: ElementRef<HTMLAudioElement>;
   ```

3. **Play Sounds with Error Handling**  
   For key/typewriter effects:
   ```typescript
   playKeySound(volume = 0.2) {
     if (this.keyStrikeSound?.nativeElement) {
       this.keyStrikeSound.nativeElement.currentTime = 0;
       this.keyStrikeSound.nativeElement.volume = volume;
       this.keyStrikeSound.nativeElement.play()
         .catch(err => console.error('Error playing sound:', err));
     }
   }
   ```
   For completion sounds:
   ```typescript
   playDingSound(volume = 0.6) {
     if (this.dingSound?.nativeElement) {
       this.dingSound.nativeElement.currentTime = 0;
       this.dingSound.nativeElement.volume = volume;
       this.dingSound.nativeElement.play()
         .catch(err => console.error('Error playing sound:', err));
     }
   }
   ```

4. **Respect User Preferences**  
   Always check mute state and user settings:
   ```typescript
   if (this.audioEnabled && !this.isMuted) {
     this.playSound();
   }
   ```

5. **Fallbacks**  
   If a sound file is missing, the system will automatically use a silent fallback. No extra code is needed.

## Testing Sounds

Use the E2E test to verify sound assets are properly installed:
```bash
npx nx e2e forgeboard-frontend-e2e --test-file=sound-system.spec.ts
```
This will check if all required sound files exist and create silent fallbacks if needed.

## Coding Standards

- All audio elements must include fallbacks for unavailable files.
- Never autoplay sounds without explicit user action.
- Always implement error handling for sound playback.
- Respect user mute/volume preferences.

For more details, see [CODING-STANDARDS.md](../../../CODING-STANDARDS.md).

---
