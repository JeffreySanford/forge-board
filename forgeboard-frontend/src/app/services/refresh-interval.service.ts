import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, shareReplay, switchMap } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RefreshIntervalService implements OnDestroy {
  private readonly apiUrl = 'http://localhost:3000/api/metrics';
  
  // Default interval in milliseconds (changed from 500ms to 3000ms)
  private intervalSubject = new BehaviorSubject<number>(3000);
  
  // Hot observable that emits on the interval
  private refreshTrigger$: Observable<number>;
  
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    // Create a hot observable that emits based on the current interval
    this.refreshTrigger$ = this.intervalSubject.pipe(
      switchMap(ms => interval(ms).pipe(startWith(0))),
      takeUntil(this.destroy$),
      shareReplay(1) // Make it hot so all subscribers get the same values
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intervalSubject.complete();
  }

  // Get the current interval value
  getInterval(): number {
    return this.intervalSubject.getValue();
  }

  // Get an observable of the current interval value
  getIntervalObservable(): Observable<number> {
    return this.intervalSubject.asObservable();
  }

  // Get the refresh trigger observable - subscribe to this for regular updates
  getRefreshTrigger(): Observable<number> {
    return this.refreshTrigger$;
  }

  // Set a new interval value
  setInterval(ms: number): void {
    if (ms >= 100 && ms <= 10000) {
      this.intervalSubject.next(ms);
      
      // Update the server-side interval setting
      this.http.get(`${this.apiUrl}/set-interval?interval=${ms}`).subscribe({
        next: () => console.log(`Server interval updated to ${ms}ms`),
        error: (err) => console.warn('Failed to update server interval, but local interval has been updated', err)
      });
    } else {
      console.warn(`Invalid interval value: ${ms}. Must be between 100ms and 10000ms.`);
    }
  }
}
