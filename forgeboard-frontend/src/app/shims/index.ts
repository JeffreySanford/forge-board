/**
 * Browser shims index file - imports and exports all shim modules
 * This file is auto-loaded via polyfills.ts
 */

console.log('[Shims] Loading all browser shims');

// Import defaults and specific named exports
import cryptoDefault from './crypto';
import streamDefault from './stream';
import perfHooksDefault, { performance as performanceObject } from './perf-hooks';

// Import namespaces for modules that might not have a primary default export
// or if the namespace itself is the intended export.
import * as pathNamespace from './path';
import * as osNamespace from './os';

// Export them with clear names
export const crypto = cryptoDefault;
export const path = pathNamespace;
export const os = osNamespace;
export const stream = streamDefault;
export const perfHooks = perfHooksDefault; // This is the default export of perf-hooks.ts (module object)
export const performance = performanceObject; // This is the specific performance object

// Global shim initialization
let initialized = false;

/**
 * Initialize all shims globally
 */
export function initializeShims(): void {
  if (initialized) return;
  console.log('[Shims] Initializing global shims');
  
  // Check environment
  if (typeof window === 'undefined') {
    console.warn('[Shims] Not in browser environment, skipping global shim initialization');
    return;
  }

  try {
    // Add global shims (careful with this - only use when necessary)
    const g = window as any;
    
    // Only add these globals if they don't already exist
    if (!g.crypto) g.crypto = crypto; // Uses the exported 'crypto' (cryptoDefault)
    if (!g.path) g.path = path;       // Uses the exported 'path' (pathNamespace)
    if (!g.os) g.os = os;           // Uses the exported 'os' (osNamespace)
    if (!g.stream) g.stream = stream; // Uses the exported 'stream' (streamDefault)
    // Use the specifically exported 'performance' object for g.performance
    if (!g.performance) g.performance = performance; 
    // perfHooks is perfHooksDefault; perfHooks.PerformanceObserver is perfHooksDefault.PerformanceObserver
    if (!g.PerformanceObserver) g.PerformanceObserver = perfHooks.PerformanceObserver; 
    
    // Create node process shims if needed
    if (!g.process) {
      g.process = {
        env: {},
        nextTick: (callback: Function, ...args: any[]) => setTimeout(() => callback(...args), 0),
        hrtime: (time?: [number, number]): [number, number] => {
          // Use the exported 'performance' object's now method
          const now = performance.now() * 1e-3;
          const seconds = Math.floor(now);
          const nanoseconds = Math.floor((now % 1) * 1e9);
          
          if (!time) return [seconds, nanoseconds];
          
          const [prevSeconds, prevNanoseconds] = time;
          const diffSeconds = seconds - prevSeconds;
          const diffNanoseconds = nanoseconds - prevNanoseconds;
          
          return [diffSeconds, diffNanoseconds];
        },
        cwd: () => '/',
        platform: os.platform(),
        arch: os.arch(),
        versions: {
          node: '14.0.0-browser-shim'
        }
      };
    }
    
    initialized = true;
    console.log('[Shims] Global shims initialized successfully');
  } catch (error) {
    console.error('[Shims] Error initializing global shims:', error);
  }
}

// Check if shim is active
export function isShimActive(): boolean {
  console.log('[Shims] Checking if shims are active');
  return initialized || typeof window !== 'undefined';
}

// Auto-initialize when imported
initializeShims();

// Export default as the initialization function
export default initializeShims;
