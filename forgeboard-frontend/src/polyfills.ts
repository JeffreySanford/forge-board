/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 */

// Load Zone.js for Angular
import 'zone.js';

// Import our browser compatibility utilities
import { initializeShims, process } from './app/utils/browser-compat';

// Run initialization if needed
initializeShims();

// Polyfill Buffer
import { Buffer } from 'buffer';
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

// Set up process object globally
(window as unknown as { process: typeof process }).process = process;

// Ensure global is defined
if (typeof window !== 'undefined' && !('global' in window)) {
  (window as unknown as { global: typeof globalThis }).global = window;
}

/**
 * Crypto polyfills are now handled by the secure-crypto implementation
 * imported through browser-compat.ts
 */