# ForgeBoard Sound System
*Last Updated: May 13, 2025*

This directory contains the modern sound system infrastructure for ForgeBoard, providing a unified approach to audio playback with comprehensive fallback mechanisms and browser compatibility.

## Architecture Overview

The sound system implements a modern TypeScript architecture with strong typing and reactive patterns through RxJS observables.

### Core Components

#### Services

- `sound.service.ts` - Primary unified sound service that handles:
  - Audio file validation and fallback creation
  - Sound playback with volume control
  - Settings management (mute, volume, enable/disable)
  - Browser autoplay policy compliance
  - Custom sound category support
  - System health monitoring and diagnostics

#### Types and Interfaces

- `sound-system.ts` - Core type definitions:
  - `SoundSettings` - Interface for sound configuration
  - `AudioSystemStatus` - Interface for sound system status
  - `AudioValidationResult` - Interface for validation results
  - `SoundFileUtils` - Browser-compatible file utilities

#### Legacy Compatibility

- `legacy-sound-services.ts` - Compatibility layer implementing:
  - `AudioValidationService` - Legacy validation service
  - `SoundHelperService` - Legacy sound helper service
  
These legacy services delegate all functionality to the modern `SoundService` while maintaining the same API for backward compatibility during the transition period.

### Module Integration

- `sound.module.ts` - Angular module that provides all sound services:
  - Import this module in your app module to use the sound system
  - Configures providers for dependency injection

## Technical Implementation

### Sound Service Initialization Flow

The sound service follows a careful initialization sequence to comply with browser autoplay policies:

1. **Pre-initialization**:
   - Set up default sound categories 
   - Configure fallback mechanism
   - Create observable streams for system status

2. **Initialization** (requires user interaction):
   - Validate existence of all required sound files
   - Create audio elements for each sound
   - Test autoplay capability
   - Update system status

3. **Post-initialization**:
   - Apply user settings (volume, mute state)
   - Monitor for system health issues
   - Provide playback capabilities

### Sound Playback Pipeline

```
┌─────────────┐    ┌───────────┐    ┌──────────────┐    ┌──────────────┐
│ Get Audio   │    │ Apply     │    │ Execute      │    │ Return       │
│ Element     │───►│ Settings  │───►│ Playback     │───►│ Observable   │
└─────────────┘    └───────────┘    └──────────────┘    └──────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌─────────────┐    ┌───────────┐    ┌──────────────┐
│ Fallback    │    │ Volume &  │    │ Error        │
│ Mechanism   │    │ Mute      │    │ Handling     │
└─────────────┘    └───────────┘    └──────────────┘
```

## Usage Examples

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { SoundService, SoundType } from '../core/sounds/sound.service';

@Component({
  selector: 'app-example',
  template: '<button (click)="playSound()">Play Sound</button>'
})
export class ExampleComponent {
  constructor(private soundService: SoundService) {}
  
  playSound(): void {
    // Initialize on user interaction to comply with autoplay policies
    this.soundService.initialize().subscribe(success => {
      if (success) {
        // Play a sound with error handling
        this.soundService.playSound(SoundType.KEYSTRIKE).subscribe(
          played => console.log('Sound played successfully:', played),
          err => console.error('Error playing sound:', err)
        );
      }
    });
  }
}
```

### Component with Full Integration

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { SoundService, SoundType } from '../core/sounds/sound.service';
import { AudioSystemStatus } from '../core/sounds/sound-system';

@Component({
  selector: 'app-sound-controls',
  templateUrl: './sound-controls.component.html'
})
export class SoundControlsComponent implements OnInit, OnDestroy {
  // Component state
  systemStatus: AudioSystemStatus | null = null;
  volume = 0.5;
  muted = false;
  enabled = true;
  
  private subscriptions = new Subscription();

  constructor(private soundService: SoundService) {}
  
  ngOnInit(): void {
    // Subscribe to system status updates
    this.subscriptions.add(
      this.soundService.status$.subscribe(status => {
        this.systemStatus = status;
      })
    );
    
    // Subscribe to settings changes
    this.subscriptions.add(
      this.soundService.getSettings().subscribe(settings => {
        this.volume = settings.volume;
        this.muted = settings.muted;
        this.enabled = settings.enabled;
      })
    );
  }
  
  // UI control handlers
  initializeAudio(): void {
    this.soundService.initialize().subscribe(success => {
      if (success) {
        this.soundService.setEnabled(true);
      }
    });
  }
  
  toggleMute(): void {
    this.soundService.setMuted(!this.muted);
  }
  
  updateVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.soundService.setVolume(volume);
  }
  
  toggleEnabled(): void {
    this.soundService.setEnabled(!this.enabled);
  }
  
  // Sound playback examples
  playDingSound(): void {
    this.soundService.playSound(SoundType.DING).subscribe();
  }
  
  playCustomSound(): void {
    // Play from a custom category
    this.soundService.playSound('notification', 0.7, 'ui').subscribe();
  }
  
  verifyHealth(): void {
    this.soundService.verifyAudioSystemHealth().subscribe(
      healthy => console.log('Sound system health:', healthy ? 'OK' : 'Issues')
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
}
```

## Extending the Sound System

### Adding a New Sound Category

To add a new sound category:

```typescript
// In your initialization code:
soundService.registerSoundCategory('game-sfx', [
  'explosion.mp3',
  'laser.mp3',
  'powerup.mp3'
]);

// Then play sounds from this category:
soundService.playSound('explosion', 0.8, 'game-sfx').subscribe();
```

### Creating a Custom Sound Controller

For more complex sound management, consider creating a dedicated service:

```typescript
@Injectable({ providedIn: 'root' })
export class GameSoundService {
  constructor(private soundService: SoundService) {
    // Register game sounds
    this.soundService.registerSoundCategory('game', [
      'start.mp3',
      'end.mp3',
      'win.mp3',
      'lose.mp3'
    ]);
  }
  
  initialize(): Observable<boolean> {
    return this.soundService.initialize();
  }
  
  playGameStart(): Observable<boolean> {
    return this.soundService.playSound('start', 1.0, 'game');
  }
  
  playGameEnd(): Observable<boolean> {
    return this.soundService.playSound('end', 0.8, 'game');
  }
  
  playWinSound(): Observable<boolean> {
    return this.soundService.playSound('win', 0.9, 'game');
  }
  
  playLoseSound(): Observable<boolean> {
    return this.soundService.playSound('lose', 0.7, 'game');
  }
}
```

## Sound Files

Sound files should be placed in the appropriate category directories under `assets/sounds/`:

```
assets/
  sounds/
    typewriter/    # Default category
      keystrike.mp3
      ding.mp3
      return.mp3
      ambient.mp3
    ui/            # UI sounds
      click.mp3
      hover.mp3
      alert.mp3
```

If any files are missing, silent fallbacks will be generated automatically via base64-encoded silent MP3 data.

## Legacy Code Support

For backward compatibility during migration, the `AudioValidationService` and `SoundHelperService` are available as wrappers that delegate to the new unified `SoundService`. All new code should use `SoundService` directly.

## Further Documentation

For more information:
- [Sound System User Guide](../../assets/sounds/README-USAGE.md)
- [Sound Assets Documentation](../../assets/sounds/README.md)
