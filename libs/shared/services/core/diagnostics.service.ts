// Shared DiagnosticsService for both frontend and backend (framework-agnostic)
// This class is not decorated with Angular or NestJS decorators.
// It can be extended or composed in framework-specific services.
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DiagnosticEvent, DiagnosticTimelineEvent } from '@forge-board/shared/diagnostics.types';
import { HealthData } from '@forge-board/shared/api-interfaces';

export class SharedDiagnosticsService {
  protected healthSubject = new BehaviorSubject<HealthData>({
    status: 'unknown',
    uptime: 0,
    timestamp: new Date().toISOString(),
    details: {}
  });

  protected diagnosticEventsSubject = new BehaviorSubject<DiagnosticEvent[]>([]);
  protected timelineSubject = new BehaviorSubject<DiagnosticTimelineEvent[]>([]);
  
  getHealthUpdates(): Observable<HealthData> {
    return this.healthSubject.asObservable();
  }

  setHealthData(data: HealthData): void {
    this.healthSubject.next(data);
  }

  registerDiagnosticEvent(event: DiagnosticEvent): void {
    // No-op in shared; override in platform-specific service
    const events = this.diagnosticEventsSubject.getValue();
    this.diagnosticEventsSubject.next([event, ...events]);
  }

  getDiagnosticEvents(): Observable<DiagnosticEvent[]> {
    return this.diagnosticEventsSubject.asObservable();
  }

  getTimelineEvents(): Observable<DiagnosticTimelineEvent[]> {
    return this.timelineSubject.asObservable();
  }

  getHealth(): Observable<HealthData> {
    return of(this.healthSubject.getValue());
  }
}
