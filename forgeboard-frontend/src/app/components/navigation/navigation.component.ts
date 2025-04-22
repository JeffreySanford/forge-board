import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  standalone: false
})
export class NavigationComponent {
  isHandset$: Observable<boolean>;

  navItems = [
    { name: 'Home', route: '/home', icon: 'home' },
    { name: 'Metrics', route: '/metrics', icon: 'assessment' },
    { name: 'Kanban', route: '/kablan', icon: 'dashboard' }
  ];
  
  constructor(private breakpointObserver: BreakpointObserver) {
    // Initialize Observable after breakpointObserver is injected
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }
}
