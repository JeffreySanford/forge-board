import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { AppComponent } from './app.component';

// Model for each animated character
export interface AnimatedChar {
  char: string;
  span: HTMLSpanElement;
  index: number;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/prefer-standalone, @angular-eslint/directive-selector
  selector: '[letterAnimator]', standalone: false
})
export class LetterAnimatorDirective implements OnInit {
  @Input() animationDelay = 0;
  @Input() characterDelay = 80;
  @Input() fieldType: 'key' | 'val' = 'key';
  @Input() playDingAtEnd = false;
  @Input() dingVolume = 0.6;

  private originalText = '';
  private animatedChars: AnimatedChar[] = [];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private appComponent: AppComponent
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.originalText = this.el.nativeElement.textContent || '';
      this.renderer.setProperty(this.el.nativeElement, 'textContent', '');
      this.createCharacterSpans();
      setTimeout(() => this.animateCharacters(), this.animationDelay);
    }, 0);
  }

  private createCharacterSpans() {
    const chars = this.originalText.split('');
    chars.forEach((char, idx) => {
      const charSpan = this.renderer.createElement('span');
      this.renderer.addClass(charSpan, 'typewriter-char');
      this.renderer.addClass(charSpan, `animate-${this.fieldType}`);
      this.renderer.setProperty(charSpan, 'textContent', char);
      this.renderer.setStyle(charSpan, 'opacity', '0');
      this.renderer.setStyle(charSpan, 'transform', 'translateY(5px)');
      this.renderer.setStyle(charSpan, 'visibility', 'hidden');
      this.renderer.appendChild(this.el.nativeElement, charSpan);
      this.animatedChars.push({ char, span: charSpan, index: idx });
    });
  }

  private animateCharacters() {
    this.animatedChars.forEach((animatedChar, index) => {
      const isLast = index === this.animatedChars.length - 1;
      setTimeout(() => {
        // Remove cursor from all chars
        this.animatedChars.forEach(c => this.renderer.removeClass(c.span, 'active-cursor'));
        // Add cursor to current char
        this.renderer.addClass(animatedChar.span, 'active-cursor');

        this.renderer.setStyle(animatedChar.span, 'visibility', 'visible');
        this.renderer.setStyle(animatedChar.span, 'opacity', '1');
        this.renderer.setStyle(animatedChar.span, 'transform', 'translateY(0)');
        const volume = 0.2 + (Math.random() * 0.1);
        const keyStrike = this.appComponent.keyStrikeSound?.nativeElement;
        if (keyStrike && keyStrike.readyState > 0) {
          keyStrike.volume = volume;
          keyStrike.currentTime = 0;
          keyStrike.play();
        }
        if (isLast && this.playDingAtEnd) {
          setTimeout(() => {
            const ding = this.appComponent.dingSound?.nativeElement;
            if (
              ding &&
              ding.readyState > 0
            ) {
              this.appComponent.playDingSound(this.dingVolume);
            }
          }, 50);
          // Remove cursor after last char
          setTimeout(() => {
            this.renderer.removeClass(animatedChar.span, 'active-cursor');
          }, 400);
        }
      }, index * this.characterDelay);
    });
  }
}
