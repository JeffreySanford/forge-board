/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 */

// Load Zone.js for Angular
import 'zone.js';

// Import the browser shims - this initializes all needed polyfills including process
import './app/shims';

// Polyfill Buffer
import { Buffer } from 'buffer';
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

// Import process from 'process' package 
import process from 'process';
(window as unknown as { process: typeof process }).process = process;

// Ensure global is defined
if (typeof window !== 'undefined' && !('global' in window)) {
  (window as unknown as { global: typeof globalThis }).global = window;
}

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