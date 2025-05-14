# ForgeBoard Sound System Usage
*Last Updated: May 13, 2025*

## Overview

The ForgeBoard sound system has been modernized to provide a more flexible and powerful approach to audio playback in the application. This document explains how to effectively use the new sound system in your components.

## Key Features

1. **Unified Sound Service**: A centralized service for all audio functionality
2. **Custom sound categories**: Define and register custom sound categories beyond the default typewriter sounds
3. **Dynamic sound directories**: Configure custom base paths for sound files
4. **Type-safe playback**: Use either enum types or string identifiers for sounds
5. **Settings management**: Control volume, muting, and enabled state globally
6. **Browser autoplay compliance**: Initialization flow respects modern browser autoplay policies
7. **Fallback mechanism**: Silent audio fallbacks when files are missing
8. **TypeScript interfaces**: Improved developer experience with strongly typed interfaces

## Integration Guide

### 1. Import the Sound Service

```typescript
import { Component } from '@angular/core';
import { SoundService, SoundType } from '@app/core/sounds/sound.service';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
})
export class MyComponent {
  constructor(private soundService: SoundService) {}
}
```

### 2. Initialize the Sound System

Sound initialization must happen after user interaction to comply with browser autoplay policies:

```typescript
userClickHandler(): void {
  this.soundService.initialize().subscribe(success => {
    if (success) {
      console.log('[Sound] System initialized successfully');
      this.soundService.setEnabled(true);
    } else {
      console.warn('[Sound] System initialization failed');
    }
  });
}
```

### 3. Play Default Sounds

```typescript
playTypewriterSound(): void {
  // Play a predefined sound from the default 'typewriter' category
  this.soundService.playSound(SoundType.KEYSTRIKE).subscribe();
  
  // Optionally provide volume (0-1)
  this.soundService.playSound(SoundType.DING, 0.7).subscribe();
}
```

## Advanced Usage

### Using the SoundEffectDirective

For simple UI elements, use the provided directive:

```html
<!-- Play sound on click (default) -->
<button appSoundEffect [soundType]="SoundType.KEYSTRIKE">Click Me</button>

<!-- Play sound on hover -->
<div appSoundEffect soundType="hover" soundEvent="hover" [soundVolume]="0.5">
  Hover over me
</div>

<!-- Play on both events -->
<button appSoundEffect soundType="click" soundEvent="both">
  Click or Hover
</button>
```

### Custom Sound Categories

Define your own sound categories for different effects:

```typescript
// Initialize with custom sound directory (optional)
this.soundService.setBaseSoundPath('assets/sounds');

// Register custom sound category
this.soundService.registerSoundCategory('ui', [
  'click.mp3',
  'hover.mp3',
  'alert.mp3'
]);

// Play a sound from custom category
this.soundService.playSound('click', undefined, 'ui').subscribe();
```

### Sound Settings Management

Control sound volume, muting, and enabled state:

```typescript
// Get current settings
this.soundService.getSettings().subscribe(settings => {
  console.log(`Volume: ${settings.volume}, Muted: ${settings.muted}`);
});

// Update settings
this.soundService.setVolume(0.5);
this.soundService.setMuted(true);
this.soundService.setEnabled(false);

// Example toggle functions for UI controls
toggleMute(): void {
  this.soundService.getSettings().pipe(take(1)).subscribe(settings => {
    this.soundService.setMuted(!settings.muted);
  });
}
```

### System Status Monitoring

Monitor the status of the sound system:

```typescript
this.soundService.status$.subscribe(status => {
  console.log(`Audio ready: ${status.audioReady}`);
  console.log(`Playback allowed: ${status.playbackAllowed}`);
  
  if (!status.audioReady) {
    // Check which files are missing
    const missingFiles = status.fileResults
      .filter(r => !r.exists)
      .map(r => `${r.category}/${r.filename}`);
    
    console.warn('[Sound] Missing files:', missingFiles);
  }
});
```

### Sound Health Verification

Verify that the sound system is working properly:

```typescript
this.soundService.verifyAudioSystemHealth().subscribe(healthy => {
  if (healthy) {
    console.log('[Sound] System is healthy');
  } else {
    console.warn('[Sound] System has issues');
  }
});
```

### Using Existing Audio Elements

Register existing audio elements from the DOM:

```typescript
@ViewChild('keystrokeAudio') keystrokeAudioRef: ElementRef<HTMLAudioElement>;

ngAfterViewInit() {
  this.soundService.registerExistingSoundElement(
    SoundType.KEYSTRIKE, 
    this.keystrokeAudioRef.nativeElement
  );
}
```

## Migration from Legacy Services

If you're using the legacy sound services, here's how to migrate:

| Legacy Service | Modern Equivalent |
|----------------|-------------------|
| `SoundHelperService.playSound(type)` | `SoundService.playSound(type)` |
| `AudioValidationService.initialize()` | `SoundService.initialize()` |
| `SoundHelperService.setVolume(vol)` | `SoundService.setVolume(vol)` |

For full backward compatibility, the system includes:
- `AudioValidationService` - Legacy wrapper that delegates to `SoundService`
- `SoundHelperService` - Legacy wrapper that delegates to `SoundService`

New code should always use the core `SoundService` directly.

## Best Practices

1. **Always check for initialization**: Call `initialize()` before playing sounds
2. **Respect user preferences**: Honor system-wide mute and volume settings
3. **Use proper typing**: Use `SoundType` enum for type safety when possible
4. **Subscribe to observables**: Remember to subscribe to sound playback observables
5. **Handle errors**: Implement error handling for sound playback failures
6. **Clean up subscriptions**: Unsubscribe from observables in `ngOnDestroy`
