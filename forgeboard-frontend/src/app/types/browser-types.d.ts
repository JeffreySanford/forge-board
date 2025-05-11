/**
 * Type definitions for browser compatibility with Node-style modules
 */

declare global {
  // Browser-compatible replacements for NodeJS types
  type Timeout = ReturnType<typeof setTimeout>;
  type Interval = ReturnType<typeof setInterval>;

  // Add missing process interfaces for browser environments
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

  // Extend Window interface to support our shims
  interface Window {
    process?: Process;
    global?: typeof globalThis;
    Buffer?: unknown;
  }

  // Add necessary Node-style crypto support
  interface Crypto {
    // Add shim methods
    randomBytes?: (size: number) => Uint8Array;
    createHash?: (algorithm: string) => unknown;
    createHmac?: (algorithm: string, key: string | Uint8Array) => unknown;
  }
}

// This empty export is necessary to make this a module
export {};
