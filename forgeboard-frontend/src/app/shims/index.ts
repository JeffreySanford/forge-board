/**
 * Browser shims index file - imports and exports all shim modules
 * This file is auto-loaded via polyfills.ts
 */

console.log('[Shims] Loading all browser shims');

// Import shims
import * as crypto from './crypto';
import * as path from './path';
import * as os from './os';
import * as stream from './stream';
import * as perfHooks from './perf-hooks';

// Export all shims
export { crypto, path, os, stream, perfHooks };

// Export individual shims for direct access
export { default as crypto } from './crypto';
export { default as stream } from './stream';
export { performance } from './perf-hooks';
export { default as perfHooks } from './perf-hooks';

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
    if (!g.crypto) g.crypto = crypto;
    if (!g.path) g.path = path;
    if (!g.os) g.os = os;
    if (!g.stream) g.stream = stream;
    if (!g.performance) g.performance = perfHooks.performance;
    if (!g.PerformanceObserver) g.PerformanceObserver = perfHooks.PerformanceObserver;
    
    // Create node process shims if needed
    if (!g.process) {
      g.process = {
        env: {},
        nextTick: (callback: Function, ...args: any[]) => setTimeout(() => callback(...args), 0),
        hrtime: (time?: [number, number]): [number, number] => {
          const now = perfHooks.performance.now() * 1e-3;
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
