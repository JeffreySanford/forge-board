import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedComponent } from './activity-feed.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [ActivityFeedComponent],
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule
  ],
  exports: [ActivityFeedComponent]
})
export class ActivityFeedModule { }
