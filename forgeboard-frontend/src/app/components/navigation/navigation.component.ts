import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

interface NavItem {
  name: string;
  route: string;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  standalone: false
})
export class NavigationComponent {
  navItems: NavItem[] = [
    { name: 'Home', route: '/home', icon: 'home', description: 'Dashboard home page' },
    { name: 'Metrics', route: '/metrics', icon: 'timeline', description: 'System performance metrics' },
    { name: 'Kablan Board', route: '/kablan', icon: 'dashboard', description: 'Task management board' },
    { name: 'Logs', route: '/logs', icon: 'receipt_long', description: 'System logs viewer' },
    { name: 'Diagnostics', route: '/diagnostics', icon: 'healing', description: 'System diagnostics' }
  ];

  isHandset$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    // Initialize isHandset$ in the constructor after breakpointObserver is available
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }
}
