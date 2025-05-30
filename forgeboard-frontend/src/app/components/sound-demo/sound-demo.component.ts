import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService, SoundType } from '../../core/sounds/sound.service';
import { MatIconModule } from '@angular/material/icon';

/**
 * Example component demonstrating the new sound system capabilities
 */
@Component({
  selector: 'app-sound-demo',
  template: `
    <div class="sound-demo">
      <h2>Sound System Demo</h2>
      
      <div class="section">
        <h3>Default Sounds</h3>
        <div class="buttons">
          <button (click)="playKeystroke()" [disabled]="!soundInitialized">Keystroke</button>
          <button (click)="playDing()" [disabled]="!soundInitialized">Ding</button>
          <button (click)="playReturn()" [disabled]="!soundInitialized">Return</button>
        </div>
      </div>
      
      <div class="section">
        <h3>Custom Sound Category</h3>
        <div class="buttons">
          <button (click)="playClickSound()" [disabled]="!soundInitialized">Click</button>
          <button (click)="playHoverSound()" [disabled]="!soundInitialized">Hover</button>
          <button (click)="playAlertSound()" [disabled]="!soundInitialized">Alert</button>
        </div>
      </div>
      
      <div class="section">
        <h3>Sound Settings</h3>
        <div class="controls">
          <label>
            Volume: 
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              [value]="volume"
              (input)="updateVolume($event)"
            />
            {{ (volume * 100).toFixed(0) }}%
          </label>
          
          <label>
            <input 
              type="checkbox" 
              [checked]="muted"
              (change)="toggleMute()"
            />
            Muted
          </label>
          
          <label>
            <input 
              type="checkbox" 
              [checked]="enabled"
              (change)="toggleEnabled()"
            />
            Sound Enabled
          </label>
        </div>
      </div>
      
      <div class="section">
        <h3>Sound System Status</h3>
        <div class="status" [ngClass]="{'status-ok': systemReady, 'status-error': !systemReady}">
          <p>Initialized: {{ soundInitialized ? 'Yes' : 'No' }}</p>
          <p>Audio Ready: {{ systemReady ? 'Yes' : 'No' }}</p>
          <p>Playback Allowed: {{ playbackAllowed ? 'Yes' : 'No' }}</p>
          
          <button (click)="initializeAudio()" *ngIf="!soundInitialized">Initialize Audio</button>
          <button (click)="verifyHealth()">Verify Health</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sound-demo {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .section {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    button {
      padding: 8px 16px;
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }
    
    .status {
      padding: 10px;
      border-radius: 4px;
    }
    
    .status-ok {
      background-color: #e7f7e7;
      border: 1px solid #4caf50;
    }
    
    .status-error {
      background-color: #ffebee;
      border: 1px solid #f44336;
    }
  `],
  imports: [CommonModule, MatIconModule],
  standalone: true
})
export class SoundDemoComponent implements OnInit {
  // Sound settings
  public volume = 0.5;
  public muted = false;
  public enabled = true;
  
  // Sound system status
  public soundInitialized = false;
  public systemReady = false;
  public playbackAllowed = false;
  
  constructor(private soundService: SoundService) {}
  
  ngOnInit(): void {
    // Check initial status
    this.soundService.status$.subscribe(status => {
      this.systemReady = status.audioReady;
      this.playbackAllowed = status.playbackAllowed;
      this.soundInitialized = status.initialized;
    });
    
    // Watch settings changes
    this.soundService.getSettings().subscribe(settings => {
      this.volume = settings.volume;
      this.muted = settings.muted;
      this.enabled = settings.enabled;
    });
    
    // Register a custom sound category for UI effects
    this.soundService.registerSoundCategory('ui', [
      'click.mp3',
      'hover.mp3',
      'alert.mp3'
    ]);
  }
  
  /**
   * Initialize the audio system
   * Should be called after user interaction
   */
  initializeAudio(): void {
    this.soundService.initialize().subscribe(success => {
      this.soundInitialized = success;
      console.log('Sound system initialized:', success);
    });
  }
  
  /**
   * Play default typewriter sounds
   */
  playKeystroke(): void {
    this.soundService.playSound(SoundType.KEYSTRIKE);
  }
  
  playDing(): void {
    this.soundService.playSound(SoundType.DING);
  }
  
  playReturn(): void {
    this.soundService.playSound(SoundType.RETURN);
  }
    /**
   * Play custom category sounds
   */
  playClickSound(): void {
    this.soundService.playSound('click', undefined, 'ui');
  }
  
  playHoverSound(): void {
    this.soundService.playSound('hover', undefined, 'ui');
  }
  
  playAlertSound(): void {
    this.soundService.playSound('alert', undefined, 'ui');
  }
  
  /**
   * Sound settings controls
   */
  updateVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.volume = value;
    this.soundService.setVolume(value);
  }
  
  toggleMute(): void {
    this.muted = !this.muted;
    this.soundService.setMuted(this.muted);
  }
  
  toggleEnabled(): void {
    this.enabled = !this.enabled;
    this.soundService.setEnabled(this.enabled);
  }
  
  /**
   * Verify sound system health
   */
  verifyHealth(): void {
    this.soundService.verifyAudioSystemHealth().subscribe(healthy => {
      this.systemReady = healthy;
      console.log('Sound system health check:', healthy ? 'PASSED' : 'FAILED');
    });
  }
}
