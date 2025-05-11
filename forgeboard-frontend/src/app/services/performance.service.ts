import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Import the shim only for types and fallback
import { performance } from '../shims/perf-hooks';

export interface TimingData {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private readonly apiUrl = `${environment.apiBaseUrl}/performance`;
  private marks = new Map<string, number>();
  private measures = new BehaviorSubject<TimingData[]>([]);
  private readonly useNativeBrowserAPI: boolean;
  
  constructor(private http: HttpClient) {
    // Check if native browser Performance API is available
    this.useNativeBrowserAPI = typeof window !== 'undefined' && 
                              window.performance && 
                              typeof window.performance.mark === 'function';
  }
  
  /**
   * Mark a performance point
   */
  mark(name: string): void {
    const time = this.getNow();
    this.marks.set(name, time);
    
    if (this.useNativeBrowserAPI) {
      // Use native performance API
      window.performance.mark(name);
    } else {
      // Use shim
      performance.mark(name);
    }
  }
  
  /**
   * Measure between two marks
   */
  measure(name: string, startMark?: string, endMark?: string): TimingData {
    let startTime: number;
    let endTime: number;
    
    if (startMark) {
      startTime = this.marks.get(startMark) || 0;
    } else {
      startTime = 0;
    }
    
    if (endMark) {
      endTime = this.marks.get(endMark) || this.getNow();
    } else {
      endTime = this.getNow();
    }
    
    const duration = endTime - startTime;
    
    if (this.useNativeBrowserAPI) {
      try {
        // Use native performance API
        window.performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn('Error using native performance.measure', e);
      }
    } else {
      // Use shim
      performance.measure(name, startMark, endMark);
    }
    
    const timingData: TimingData = {
      name,
      startTime,
      duration
    };
    
    // Add to measures collection
    const current = this.measures.getValue();
    this.measures.next([...current, timingData]);
    
    // Optionally send to server for analytics
    this.saveTimingData(timingData).subscribe();
    
    return timingData;
  }
  
  /**
   * Save timing data to server for analytics
   */
  private saveTimingData(data: TimingData): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/timing`, data).pipe(
      catchError(error => {
        console.warn('Failed to save timing data to server', error);
        return of(null);
      })
    );
  }
  
  /**
   * Get all measures
   */
  getMeasures(): Observable<TimingData[]> {
    return this.measures.asObservable();
  }
  
  /**
   * Get current time
   */
  private getNow(): number {
    if (this.useNativeBrowserAPI) {
      return window.performance.now();
    } else {
      return performance.now();
    }
  }
  
  /**
   * Clear all marks
   */
  clearMarks(): void {
    this.marks.clear();
    
    if (this.useNativeBrowserAPI) {
      window.performance.clearMarks();
    } else {
      performance.clearMarks();
    }
  }
  
  /**
   * Create a timerified version of a function
   */
  timerify<T extends (...args: unknown[]) => unknown>(fn: T, name: string): T {
    const wrappedFn = (...args: Parameters<T>) => {
      const start = this.getNow();
      try {
        return fn(...args) as ReturnType<T>;
      } finally {
        const duration = this.getNow() - start;
        const timingData: TimingData = {
          name,
          startTime: start,
          duration,
          metadata: { args: args.length }
        };
        
        const current = this.measures.getValue();
        this.measures.next([...current, timingData]);
      }
    };
    
    return wrappedFn as unknown as T;
  }
  
  /**
   * Handle performance data from server
   */
  private handleServerPerformanceData(): void {
    // Implementation for handling performance data from the server
  }
  
  /**
   * Convert client mark to server mark format
   */
  private convertToServerMark(mark: PerformanceMark): ServerMark {
    return {
      name: mark.name,
      timestamp: mark.startTime,
      duration: mark.duration,
      type: mark.entryType,
      metadata: mark.detail
    };
  }
  
  /**
   * Create a performance promise
   */
  private createPerformancePromise(callback: (resolve: (value: number) => void) => void): Promise<number> {
    return new Promise<number>(resolve => {
      callback(resolve);
    });
  }
}

interface PerformanceMark {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
  detail?: Record<string, unknown>;
}

interface ServerMark {
  name: string;
  timestamp: number;
  duration: number;
  type: string;
  metadata?: Record<string, unknown>;
}
