/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 */

// Load Zone.js for Angular
import 'zone.js';

// Import the browser shims
import './app/shims';

// Standard polyfills
/**
 * Extended Window interface with global property
 */

// Polyfill Buffer
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

// Polyfill process
import process from 'process/browser';
(window as any).process = process;


/**
 * Add process polyfill for Browser
 */
interface Process {
  env: Record<string, string>;
  nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
  hrtime: (time?: [number, number]) => [number, number];
  cwd: () => string;
  platform: string;
  arch: string;
  versions: {
    node: string;
    [key: string]: string;
  };
}

// First set up basic process object for browser
if (typeof window !== 'undefined' && !(window as any).process) {
  // Cast window to unknown first to avoid type errors
  (window as unknown as { process: Process }).process = {
    env: {},
    nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
      setTimeout(() => callback(...args), 0);
    },
    hrtime: (time?: [number, number]): [number, number] => {
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
    platform: 'browser',
    arch: 'browser',
    versions: {
      node: '16.0.0-polyfill'
    }
  };
} else if (typeof window !== 'undefined' && (window as any).process) {
  // Ensure env is an object if process already exists
  (window as any).process.env = (window as any).process.env || {};
  (window as any).process.nextTick = (window as any).process.nextTick || ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    setTimeout(() => callback(...args), 0);
  });
  // Add other fallbacks for process properties if necessary
  (window as any).process.cwd = (window as any).process.cwd || (() => '/');
  (window as any).process.platform = (window as any).process.platform || 'browser';
  (window as any).process.arch = (window as any).process.arch || 'browser';
  (window as any).process.versions = (window as any).process.versions || { node: '16.0.0-polyfill' };

}

// Ensure global is defined
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as unknown as { global: typeof globalThis }).global = window;
}

// Import shims to polyfill Node.js built-in modules
import './app/shims/index';

/**
 * Polyfill things that may be missing from window.crypto
 */
if (typeof window !== 'undefined' && window.crypto && !window.crypto.getRandomValues) {
  // Add a basic fallback for getRandomValues if it's somehow missing
  (window.crypto as unknown as {
    getRandomValues: (array: Uint8Array) => Uint8Array
  }).getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}