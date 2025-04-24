import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

// Activity entry interface
interface ActivityEntry {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
  icon: string;
}

@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
  standalone: false
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  activities: ActivityEntry[] = [];
  private nextId = 1;
  private subscription = new Subscription();
  
  constructor() {
    // No initialization required
  }
  
  ngOnInit(): void {
    // Add initial activities
    this.addActivity('jeffreys', 'logged in', 'login');
    this.addActivity('system', 'performed backup', 'backup');
    
    // Generate random activities every 4-12 seconds
    const activityInterval = interval(4000).subscribe(() => {
      if (Math.random() > 0.7) {
        this.generateRandomActivity();
      }
    });
    
    this.subscription.add(activityInterval);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  // Add a new activity entry
  private addActivity(user: string, action: string, icon: string): void {
    const entry: ActivityEntry = {
      id: this.nextId++,
      timestamp: new Date(),
      user,
      action,
      icon
    };
    
    // Add to beginning of array
    this.activities.unshift(entry);
    
    // Keep only the most recent activities
    if (this.activities.length > 8) {
      this.activities.pop();
    }
  }
  
  // Generate a random activity
  private generateRandomActivity(): void {
    const users = ['jeffreys', 'maria', 'alex', 'system', 'admin', 'guest'];
    const actions = [
      'updated profile',
      'created document',
      'deleted file',
      'changed settings',
      'shared document',
      'logged out',
      'viewed dashboard',
      'downloaded report'
    ];
    const icons = [
      'person',
      'description',
      'delete',
      'settings',
      'share',
      'exit_to_app',
      'dashboard',
      'download'
    ];
    
    // Select random elements
    const userIndex = Math.floor(Math.random() * users.length);
    const actionIndex = Math.floor(Math.random() * actions.length);
    
    this.addActivity(
      users[userIndex], 
      actions[actionIndex], 
      icons[Math.min(actionIndex, icons.length - 1)]
    );
  }
  
  // Get icon for activity
  getActivityIcon(icon: string): string {
    switch(icon) {
      case 'login': return 'login';
      case 'backup': return 'backup';
      default: return icon;
    }
  }
}
