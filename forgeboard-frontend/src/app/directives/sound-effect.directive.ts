import { Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { SoundService, SoundType } from '../core/sounds/sound.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appSoundEffect]',
  standalone: false
})
export class SoundEffectDirective implements OnDestroy {
  @Input() soundType: SoundType = SoundType.KEYSTRIKE;
  @Input() soundVolume?: number;
  @Input() soundEvent: 'click' | 'hover' | 'both' = 'click';
  
  private subscription = new Subscription();

  constructor(
    private el: ElementRef, 
    private soundService: SoundService
  ) {}

  @HostListener('click') 
  onClick(): void {
    if (this.soundEvent === 'click' || this.soundEvent === 'both') {
      this.playSound();
    }
  }

  @HostListener('mouseenter') 
  onMouseEnter(): void {
    if (this.soundEvent === 'hover' || this.soundEvent === 'both') {
      this.playSound();
    }
  }
  private playSound(): void {
    this.subscription.add(
      this.soundService.playSound(this.soundType, this.soundVolume).subscribe()
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscription.unsubscribe();
  }
}
