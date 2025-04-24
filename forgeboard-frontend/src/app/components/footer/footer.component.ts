import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';

interface CalloutLine {
  key: string;
  value: string;
  keyDelay: number;
  keyCharDelay: number;
  valDelay: number;
  valCharDelay: number;
  dingVolume?: number;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit {
  @Input() showContextBlock = true;
  @Input() showLayoutBorder = true;
  @Input() animationsStarted = false;
  @Input() audioEnabled = false;
  @Input() userData: any = null;

  @ViewChild('keyStrikeSound') keyStrikeSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('dingSound') dingSound!: ElementRef<HTMLAudioElement>;

  activeCursor = { field: -1, value: -1 };
  calloutLines: CalloutLine[] = [];
  todayDate = new Date().toLocaleDateString();

  ngOnInit(): void {
    this.initCalloutLines();
    this.updateCursorPosition();
  }

  initCalloutLines(): void {
    this.calloutLines = [
      {
        key: 'USER:',
        value: this.userData?.name || 'JEFFREY SANFORD',
        keyDelay: 0,
        keyCharDelay: 80,
        valDelay: 1000,
        valCharDelay: 80,
        dingVolume: 0.6
      },
      {
        key: 'USERNAME:',
        value: this.userData?.username || 'jeffrey.sanford',
        keyDelay: 2000,
        keyCharDelay: 80,
        valDelay: 3200,
        valCharDelay: 80,
        dingVolume: 0.7
      },
      {
        key: 'TITLE:',
        value: this.userData?.title || 'SYSTEMS ARCHITECT',
        keyDelay: 4000,
        keyCharDelay: 100,
        valDelay: 4800,
        valCharDelay: 80
      },
      {
        key: 'CREATED:',
        value: this.userData?.created || '04/20/2025',
        keyDelay: 6000,
        keyCharDelay: 100,
        valDelay: 7000,
        valCharDelay: 80
      },
      {
        key: 'MODIFIED:',
        value: this.userData?.modified || this.todayDate,
        keyDelay: 8000,
        keyCharDelay: 100,
        valDelay: 9000,
        valCharDelay: 80
      }
    ];
  }

  isCursorActive(type: 'field' | 'value', index: number): boolean {
    return this.animationsStarted && this.activeCursor[type] === index;
  }

  updateCursorPosition(): void {
    const lineStartTimes = [0, 2, 4, 6, 8];
    const valueStartTimes = [1, 3.2, 4.8, 7, 9];
    const fieldDurations = [1, 1.2, 0.8, 1, 1.1];
    const valueDurations = [1.4, 1.5, 1.6, 1, 1];
    this.activeCursor = { field: -1, value: -1 };
    
    lineStartTimes.forEach((time, idx) => {
      setTimeout(() => {
        this.activeCursor.field = idx;
        this.activeCursor.value = -1;
      }, time * 1000);
      setTimeout(() => {
        if (this.activeCursor.field === idx) {
          this.activeCursor.field = -1;
        }
      }, (time + fieldDurations[idx]) * 1000);
    });
    
    valueStartTimes.forEach((time, idx) => {
      setTimeout(() => {
        this.activeCursor.field = -1;
        this.activeCursor.value = idx;
      }, time * 1000);
      setTimeout(() => {
        if (this.activeCursor.value === idx) {
          this.activeCursor.value = -1;
        }
      }, (time + valueDurations[idx]) * 1000);
    });
  }

  playDingSound(volume?: number): void {
    try {
      if (!this.dingSound?.nativeElement) return;
      const dingElement = this.dingSound.nativeElement;
      dingElement.currentTime = 0;
      dingElement.volume = volume || 0.6;
      dingElement.play().catch(() => {
        console.error('Error playing ding sound');
      });
    } catch {
      console.error('Error setting up ding sound playback');
    }
  }
}
