/**
 * Browser compatibility module
 * Provides essential APIs that would normally be available in Node.js
 * This is a more organized replacement for the old shims directory
 */

import { CryptoService } from '@forge-board/shared/api-interfaces';

// Re-export native browser APIs where available
export const performance = window.performance;
export const PerformanceObserver = window.PerformanceObserver;

// OS utilities
export const os = {
  platform: (): string => {
    return navigator.platform.toLowerCase().includes('win') ? 'win32' : 
           navigator.platform.toLowerCase().includes('mac') ? 'darwin' :
           navigator.platform.toLowerCase().includes('linux') ? 'linux' : 'browser';
  },
  arch: (): string => {
    return navigator.userAgent.includes('x64') || navigator.userAgent.includes('x86_64') ? 'x64' : 'ia32';
  },
  totalmem: (): number => {
    return navigator?.deviceMemory ? navigator.deviceMemory * 1024 * 1024 * 1024 : 8 * 1024 * 1024 * 1024;
  },
  freemem: (): number => {
    // No way to get free memory in browser, estimate 25% of total
    return (navigator?.deviceMemory ? navigator.deviceMemory * 1024 * 1024 * 1024 : 8 * 1024 * 1024 * 1024) * 0.25;
  },
  uptime: (): number => {
    // Return time since page load
    return performance.now() / 1000;
  }
};

// Path utilities
export const path = {
  join: (...parts: string[]): string => {
    return parts.join('/').replace(/\/+/g, '/');
  },
  resolve: (...parts: string[]): string => {
    return parts.join('/').replace(/\/+/g, '/');
  },
  basename: (p: string, ext?: string): string => {
    const base = p.split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  },
  dirname: (p: string): string => {
    const parts = p.split('/');
    parts.pop();
    return parts.join('/') || '/';
  },
  extname: (p: string): string => {
    const base = p.split('/').pop() || '';
    const i = base.lastIndexOf('.');
    return i < 0 ? '' : base.slice(i);
  }
};

// Crypto utilities
export const crypto = {
  getRandomValues: (array: Uint8Array): Uint8Array => {
    if (window.crypto) {
      return window.crypto.getRandomValues(array);
    }
    
    // Fallback implementation (less secure but works)
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  
  createHash: (algorithm: string, data: string, encoding = 'hex'): Promise<string> => {
    return CryptoService.createHash(algorithm, data, encoding as 'hex' | 'base64');
  },
  
  randomBytes: (size: number, encoding?: 'hex' | 'base64'): Promise<string | Uint8Array> => {
    return CryptoService.randomBytes(size, encoding);
  }
};

// Process utilities
export const process = window.process || {
  env: {},
  cwd: () => '/',
  nextTick: (cb: (...args: any[]) => void, ...args: any[]): void => {
    setTimeout(() => cb(...args), 0);
  }
};

// Backward compatibility
export const initializeShims = (): void => {
  console.log('[BrowserCompat] Browser compatibility layer is active');
};
