// Shared DiagnosticsService for both frontend and backend (framework-agnostic)
// This class is not decorated with Angular or NestJS decorators.
// It can be extended or composed in framework-specific services.
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HealthData, DiagnosticEvent } from '@forge-board/shared/api-interfaces';

export class SharedDiagnosticsService {
  protected healthSubject = new BehaviorSubject<HealthData>({
    status: 'unknown',
    uptime: 0,
    timestamp: new Date().toISOString(),
    details: {}
  });

  getHealthUpdates(): Observable<HealthData> {
    return this.healthSubject.asObservable();
  }

  setHealthData(data: HealthData): void {
    this.healthSubject.next(data);
  }

  registerDiagnosticEvent(event: DiagnosticEvent): void {
    // No-op in shared; override in platform-specific service
  }

  getHealth(): Observable<HealthData> {
    return of(this.healthSubject.getValue());
  }
}
