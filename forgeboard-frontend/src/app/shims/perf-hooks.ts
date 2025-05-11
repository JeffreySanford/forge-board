/**
 * Minimal browser-compatible implementation of Node's perf_hooks module
 */

console.log('[Shim] Performance hooks module loaded');

/**
 * PerformanceEntry class similar to Node's PerformanceEntry
 */
export class PerformanceEntry {
  readonly name: string;
  readonly entryType: string;
  readonly startTime: number;
  readonly duration: number;

  constructor(name: string, entryType: string, startTime: number, duration: number) {
    this.name = name;
    this.entryType = entryType;
    this.startTime = startTime;
    this.duration = duration;
    
    console.log(`[Shim] PerformanceEntry created: ${name}, type: ${entryType}, duration: ${duration}ms`);
  }
}

/**
 * PerformanceMark class similar to Node's PerformanceMark
 */
export class PerformanceMark extends PerformanceEntry {
  constructor(name: string, startTime: number) {
    super(name, 'mark', startTime, 0);
    console.log(`[Shim] PerformanceMark created: ${name} at ${startTime}ms`);
  }
}

/**
 * PerformanceMeasure class similar to Node's PerformanceMeasure
 */
export class PerformanceMeasure extends PerformanceEntry {
  readonly detail: unknown;

  constructor(name: string, startTime: number, duration: number, detail?: unknown) {
    super(name, 'measure', startTime, duration);
    this.detail = detail;
    console.log(`[Shim] PerformanceMeasure created: ${name}, duration: ${duration}ms`);
  }
}

/**
 * PerformanceNodeTiming class similar to Node's PerformanceNodeTiming
 */
export class PerformanceNodeTiming extends PerformanceEntry {
  readonly bootstrapComplete: number;
  readonly environment: number;
  readonly loopStart: number;
  readonly loopExit: number;
  readonly nodeStart: number;
  readonly v8Start: number;

  constructor() {
    const now = performance.now();
    super('node', 'node', 0, now);
    
    this.bootstrapComplete = now;
    this.environment = 0;
    this.loopStart = 0;
    this.loopExit = -1;
    this.nodeStart = 0;
    this.v8Start = 0;
    
    console.log('[Shim] PerformanceNodeTiming created');
  }
}

/**
 * PerformanceObserverEntryList interface
 */
export interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
  getEntriesByName(name: string): PerformanceEntry[];
  getEntriesByType(type: string): PerformanceEntry[];
}

/**
 * PerformanceObserver class similar to Node's PerformanceObserver
 */
export class PerformanceObserver {
  private callback: (list: PerformanceObserverEntryList, observer: PerformanceObserver) => void;
  private entryTypes: string[];
  private observer: globalThis.PerformanceObserver | null;

  constructor(callback: (list: PerformanceObserverEntryList, observer: PerformanceObserver) => void) {
    this.callback = callback;
    this.entryTypes = [];
    this.observer = null;
    
    console.log('[Shim] PerformanceObserver created');
    
    if (typeof window !== 'undefined' && window.PerformanceObserver) {
      this.observer = new window.PerformanceObserver((entries: PerformanceObserverEntryList) => {
        this.callback({
          getEntries: () => entries.getEntries().map(this.convertEntry),
          getEntriesByName: (name: string) => entries.getEntriesByName(name).map(this.convertEntry),
          getEntriesByType: (type: string) => entries.getEntriesByType(type).map(this.convertEntry)
        }, this);
      });
    }
  }

  observe(options: { entryTypes: string[] }): void {
    console.log(`[Shim] PerformanceObserver.observe called with types: ${options.entryTypes.join(', ')}`);
    this.entryTypes = options.entryTypes;
    
    if (this.observer) {
      try {
        this.observer.observe({ entryTypes: options.entryTypes });
      } catch (e) {
        console.error('[Shim] PerformanceObserver.observe error:', e);
      }
    }
  }

  disconnect(): void {
    console.log('[Shim] PerformanceObserver.disconnect called');
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private convertEntry(entry: globalThis.PerformanceEntry): PerformanceEntry {
    if (entry.entryType === 'mark') {
      return new PerformanceMark(entry.name, entry.startTime);
    } else if (entry.entryType === 'measure') {
      return new PerformanceMeasure(
        entry.name,
        entry.startTime,
        entry.duration,
        (entry as unknown as { detail?: unknown }).detail
      );
    }
    return new PerformanceEntry(
      entry.name,
      entry.entryType,
      entry.startTime,
      entry.duration
    );
  }
}

/**
 * PerformanceObserverEntryList interface
 */
export interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
  getEntriesByName(name: string): PerformanceEntry[];
  getEntriesByType(type: string): PerformanceEntry[];
}

/**
 * Monkeypatch the Performance class to add Node.js-style methods
 */
class PerformanceMonkeyPatch {
  private marks = new Map<string, number>();
  
  constructor() {
    console.log('[Shim] Performance monkey patch created');
  }

  now(): number {
    const browserNow = typeof performance !== 'undefined' ? performance.now() : 0;
    console.log(`[Shim] performance.now called: ${browserNow.toFixed(2)}ms`);
    return browserNow;
  }

  mark(name: string): PerformanceMark {
    console.log(`[Shim] performance.mark called: ${name}`);
    const time = this.now();
    this.marks.set(name, time);
    
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(name);
      } catch (e) {
        console.error('[Shim] Error calling performance.mark:', e);
      }
    }
    
    return new PerformanceMark(name, time);
  }

  measure(name: string, startMark?: string, endMark?: string): PerformanceMeasure {
    console.log(`[Shim] performance.measure called: ${name}, from ${startMark || 'start'} to ${endMark || 'now'}`);
    const endTime = endMark ? (this.marks.get(endMark) || this.now()) : this.now();
    const startTime = startMark ? (this.marks.get(startMark) || 0) : 0;
    const duration = endTime - startTime;
    
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.error('[Shim] Error calling performance.measure:', e);
      }
    }
    
    return new PerformanceMeasure(name, startTime, duration);
  }

  clearMarks(name?: string): void {
    console.log(`[Shim] performance.clearMarks called: ${name || 'all'}`);
    if (name) {
      this.marks.delete(name);
    } else {
      this.marks.clear();
    }
    
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      try {
        performance.clearMarks(name);
      } catch (e) {
        console.error('[Shim] Error calling performance.clearMarks:', e);
      }
    }
  }

  clearMeasures(name?: string): void {
    console.log(`[Shim] performance.clearMeasures called: ${name || 'all'}`);
    
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      try {
        performance.clearMeasures(name);
      } catch (e) {
        console.error('[Shim] Error calling performance.clearMeasures:', e);
      }
    }
  }

  getEntries(): PerformanceEntry[] {
    console.log('[Shim] performance.getEntries called');
    if (typeof performance !== 'undefined' && performance.getEntries) {
      return performance.getEntries().map(entry => new PerformanceEntry(
        entry.name,
        entry.entryType,
        entry.startTime,
        entry.duration
      ));
    }
    return [];
  }

  getEntriesByName(name: string, type?: string): PerformanceEntry[] {
    console.log(`[Shim] performance.getEntriesByName called: ${name}, type: ${type || 'any'}`);
    if (typeof performance !== 'undefined' && performance.getEntriesByName) {
      return performance.getEntriesByName(name, type).map(entry => new PerformanceEntry(
        entry.name,
        entry.entryType,
        entry.startTime,
        entry.duration
      ));
    }
    return [];
  }

  getEntriesByType(type: string): PerformanceEntry[] {
    console.log(`[Shim] performance.getEntriesByType called: ${type}`);
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      return performance.getEntriesByType(type).map(entry => new PerformanceEntry(
        entry.name,
        entry.entryType,
        entry.startTime,
        entry.duration
      ));
    }
    return [];
  }

  timerify<T extends (...args: unknown[]) => unknown>(fn: T): T {
    console.log('[Shim] performance.timerify called');
    const timerifiedFn = (...args: Parameters<T>): ReturnType<T> => {
      const start = this.now();
      try {
        return fn(...args) as ReturnType<T>;
      } finally {
        const duration = this.now() - start;
        console.log(`[Shim] Timerified function took ${duration.toFixed(2)}ms to execute`);
      }
    };
    return timerifiedFn as unknown as T;
  }

  nodeTiming(): PerformanceNodeTiming {
    console.log('[Shim] performance.nodeTiming called');
    return new PerformanceNodeTiming();
  }

  timeOrigin(): number {
    const origin = typeof performance !== 'undefined' && performance.timeOrigin 
      ? performance.timeOrigin 
      : Date.now() - this.now();
    
    console.log(`[Shim] performance.timeOrigin: ${origin}`);
    return origin;
  }
}

// Create the performance shim instance
const monkeyPatchedPerformance = new PerformanceMonkeyPatch();

// Combine all exports into a single performance export
export const performance = {
  now: monkeyPatchedPerformance.now.bind(monkeyPatchedPerformance),
  mark: monkeyPatchedPerformance.mark.bind(monkeyPatchedPerformance),
  measure: monkeyPatchedPerformance.measure.bind(monkeyPatchedPerformance),
  clearMarks: monkeyPatchedPerformance.clearMarks.bind(monkeyPatchedPerformance),
  clearMeasures: monkeyPatchedPerformance.clearMeasures.bind(monkeyPatchedPerformance),
  getEntries: monkeyPatchedPerformance.getEntries.bind(monkeyPatchedPerformance),
  getEntriesByName: monkeyPatchedPerformance.getEntriesByName.bind(monkeyPatchedPerformance),
  getEntriesByType: monkeyPatchedPerformance.getEntriesByType.bind(monkeyPatchedPerformance),
  timerify: monkeyPatchedPerformance.timerify.bind(monkeyPatchedPerformance),
  nodeTiming: monkeyPatchedPerformance.nodeTiming.bind(monkeyPatchedPerformance),
  timeOrigin: monkeyPatchedPerformance.timeOrigin(),
  eventLoopUtilization: () => ({ idle: 0, active: 0, utilization: 0 })
};

/**
 * Monkey-patching performance.toJSON method
 */
(performance as unknown as { toJSON: () => unknown }).toJSON = function toJSON() {
  console.log('[Shim] performance.toJSON called');
  return {
    nodeTiming: performance.nodeTiming(),
    timeOrigin: performance.timeOrigin
  };
};

// Add a method to check if the shim is being used
export function isShimActive(): boolean {
  console.log('[Shim] Performance hooks shim usage detected');
  return true;
}

export default {
  performance,
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
  PerformanceNodeTiming,
  PerformanceObserver,
  isShimActive
};
