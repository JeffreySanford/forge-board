import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TypeDiagnosticsService, TypeDiagnosticEvent } from '../../services/type-diagnostics.service';

@Component({
  selector: 'app-type-diagnostics',
  templateUrl: './type-diagnostics.component.html',
  styleUrls: ['./type-diagnostics.component.scss'],
  standalone: false,
})

export class TypeDiagnosticsComponent implements OnInit, OnDestroy {
  events: TypeDiagnosticEvent[] = [];
  filteredEvents: TypeDiagnosticEvent[] = [];
  activeFilter: 'all' | 'errors' | 'success' = 'all';
  expanded = false;
  errorCount = 0;
  
  // Add list of registered validators
  registeredValidators: string[] = [];
  
  private subscription = new Subscription();
  
  constructor(private typeDiagnostics: TypeDiagnosticsService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.typeDiagnostics.getDiagnosticEvents().subscribe(events => {
        this.events = events;
        this.applyFilter();
        this.errorCount = events.filter(e => !e.valid).length;
      })
    );
    
    // Get list of registered validators
    this.registeredValidators = this.typeDiagnostics.getRegisteredValidators();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }
  
  setFilter(filter: 'all' | 'errors' | 'success'): void {
    this.activeFilter = filter;
    this.applyFilter();
  }
  
  applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredEvents = [...this.events];
    } else if (this.activeFilter === 'errors') {
      this.filteredEvents = this.events.filter(e => !e.valid);
    } else {
      this.filteredEvents = this.events.filter(e => e.valid);
    }
  }
  
  clearEvents(): void {
    this.typeDiagnostics.clearEvents();
  }
  
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }
  
  getIssuesPreview(issues: string[]): string {
    if (!issues.length) return 'No issues';
    if (issues.length === 1) return issues[0];
    return `${issues[0]} (+${issues.length - 1} more)`;
  }
  
  // Method to get string representation safely
  getStringRepresentation(event: TypeDiagnosticEvent): string {
    return event.stringRepresentation || (event.data ? JSON.stringify(event.data) : 'No data');
  }
}
