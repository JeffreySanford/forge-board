/**
 * Minimal browser-compatible implementation of Node's stream module
 */

import { EventEmitter } from 'events';

console.log('[Shim] Stream module loaded');

// Define interfaces to match NodeJS types without relying on @types/node
interface NodeJSWritable {
  writable: boolean;
  write(chunk: unknown, encoding?: string, callback?: (error?: Error | null) => void): boolean;
  end(chunk?: unknown, encoding?: string, callback?: () => void): void;
  cork(): void;
  uncork(): void;
  destroy(): void;
  // Add emit method signature as Writable streams in Node.js are EventEmitters
  emit(event: string | symbol, ...args: any[]): boolean;
}

interface NodeJSReadable {
  readable: boolean;
  read(size?: number): unknown;
  destroy(): void;
}

/**
 * Base Stream class that extends EventEmitter
 */
export class Stream extends EventEmitter {
  constructor() {
    super();
    console.log('[Shim] Stream instance created');
  }

  pipe(destination: NodeJSWritable): NodeJSWritable {
    console.log('[Shim] Stream.pipe called');
    this.on('data', (chunk) => destination.write(chunk));
    this.on('end', () => destination.end());
    this.on('error', (err) => destination.emit('error', err));
    return destination;
  }
}

/**
 * Readable Stream implementation for browsers
 */
export class ReadableStream extends Stream implements NodeJSReadable {
  readable = true;
  private _buffer: unknown[] = [];
  private _encoding: string | null = null;
  private _paused = false;
  private _ended = false;
  private _flowing = false;

  constructor(options: { encoding?: string } = {}) {
    super();
    console.log('[Shim] ReadableStream instance created');
    
    if (options && options.encoding) {
      this._encoding = options.encoding;
    }
  }

  read(size?: number): unknown {
    // Basic implementation - ignore size for simplicity
    return this._buffer.shift();
  }

  pause(): this {
    console.log('[Shim] ReadableStream.pause called');
    this._paused = true;
    this._flowing = false;
    this.emit('pause');
    return this;
  }

  resume(): this {
    console.log('[Shim] ReadableStream.resume called');
    this._paused = false;
    this._flowing = true;
    this._read();
    this.emit('resume');
    return this;
  }

  push(chunk: unknown): boolean {
    console.log('[Shim] ReadableStream.push called');
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }

    // If we're in object mode or the encoding is set, convert the chunk
    if (this._encoding && typeof chunk === 'string') {
      if (this._encoding === 'utf8' || this._encoding === 'utf-8') {
        // No need to convert, already a string
      } else if (this._encoding === 'base64') {
        chunk = btoa(chunk);
      } else if (this._encoding === 'hex') {
        chunk = [...chunk].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      }
    }

    this._buffer.push(chunk);
    
    if (this._flowing) {
      this._read();
    }
    
    return true;
  }

  private _read(): void {
    if (this._paused || this._buffer.length === 0) return;
    
    setTimeout(() => {
      while (this._buffer.length > 0 && !this._paused) {
        const chunk = this._buffer.shift();
        this.emit('data', chunk);
      }
      
      if (this._buffer.length === 0 && this._ended) {
        this.emit('end');
      }
    }, 0);
  }

  override pipe<T extends NodeJSWritable>(destination: T): T {
    console.log('[Shim] ReadableStream.pipe called');
    super.pipe(destination);
    return destination;
  }

  destroy(): void {
    this.emit('close');
    this._buffer = [];
    this._ended = true;
  }
}

/**
 * Writable Stream implementation for browsers
 */
export class WritableStream extends Stream implements NodeJSWritable {
  writable = true;
  private _encoding: string | null = null;
  private _buffer: unknown[] = [];
  private _ended = false;
  
  constructor(options: { encoding?: string } = {}) {
    super();
    console.log('[Shim] WritableStream instance created');
    
    if (options && options.encoding) {
      this._encoding = options.encoding;
    }
  }

  write(
    chunk: unknown, 
    encodingOrCallback?: string | ((error?: Error) => void), 
    callback?: (error?: Error) => void
  ): boolean {
    console.log('[Shim] WritableStream.write called');
    
    let cb: ((error?: Error) => void) | undefined;
    
    if (typeof encodingOrCallback === 'function') {
      cb = encodingOrCallback;
    } else {
      cb = callback;
    }
    
    if (this._ended) {
      const error = new Error('Cannot write after end');
      if (cb) {
        cb(error);
      }
      this.emit('error', error);
      return false;
    }
    
    this._buffer.push(chunk);
    this.emit('data', chunk);
    
    if (cb) {
      cb();
    }
    
    return true;
  }

  end(
    chunkOrCallback?: unknown, 
    encodingOrCallback?: string | (() => void), 
    callback?: () => void
  ): void {
    console.log('[Shim] WritableStream.end called');
    
    let chunk: unknown;
    let cb: (() => void) | undefined;
    
    if (typeof chunkOrCallback === 'function') {
      cb = chunkOrCallback as () => void;
    } else if (chunkOrCallback !== undefined) {
      chunk = chunkOrCallback;
      
      if (typeof encodingOrCallback === 'function') {
        cb = encodingOrCallback;
      } else {
        cb = callback;
      }
    } else {
      cb = undefined;
    }
    
    if (chunk !== undefined) {
      this.write(chunk, encodingOrCallback as string, cb as (error?: Error) => void);
    } else if (cb) {
      cb();
    }
    
    this._ended = true;
    this.emit('finish');
    this.emit('end');
  }

  cork(): void {
    console.log('[Shim] WritableStream.cork called (no-op in browser shim)');
    // No-op in browser
  }

  uncork(): void {
    console.log('[Shim] WritableStream.uncork called (no-op in browser shim)');
    // No-op in browser
  }

  destroy(): void {
    this._ended = true;
    this.emit('close');
  }
}

/**
 * Duplex Stream implementation for browsers
 */
export class DuplexStream extends Stream implements NodeJSReadable, NodeJSWritable {
  readable = true;
  writable = true;
  private readonly readableImpl: ReadableStream;
  private readonly writableImpl: WritableStream;
  
  constructor(options: { encoding?: string } = {}) {
    super();
    console.log('[Shim] DuplexStream instance created');
    
    this.readableImpl = new ReadableStream(options);
    this.writableImpl = new WritableStream(options);
    
    // Forward events
    ['data', 'end', 'error', 'close', 'pause', 'resume'].forEach(event => {
      this.readableImpl.on(event, (...args) => this.emit(event, ...args));
    });
    
    ['drain', 'finish', 'pipe', 'unpipe', 'error', 'close'].forEach(event => {
      this.writableImpl.on(event, (...args) => this.emit(event, ...args));
    });
  }

  write(
    chunk: unknown, 
    encodingOrCallback?: string | ((error?: Error) => void), 
    callback?: (error?: Error) => void
  ): boolean {
    console.log('[Shim] DuplexStream.write called');
    return this.writableImpl.write(
      chunk, 
      encodingOrCallback as string, 
      callback as (error?: Error) => void
    );
  }

  end(
    chunkOrCallback?: unknown, 
    encodingOrCallback?: string | (() => void), 
    callback?: () => void
  ): void {
    console.log('[Shim] DuplexStream.end called');
    this.writableImpl.end(chunkOrCallback, encodingOrCallback as string, callback);
  }

  read(size?: number): unknown {
    console.log('[Shim] DuplexStream.read called');
    return this.readableImpl.read(size);
  }

  push(chunk: unknown): boolean {
    console.log('[Shim] DuplexStream.push called');
    return this.readableImpl.push(chunk);
  }

  override pipe<T extends NodeJSWritable>(destination: T): T {
    console.log('[Shim] DuplexStream.pipe called');
    return this.readableImpl.pipe(destination);
  }

  cork(): void {
    this.writableImpl.cork();
  }

  uncork(): void {
    this.writableImpl.uncork();
  }

  destroy(): void {
    this.readableImpl.destroy();
    this.writableImpl.destroy();
    this.emit('close');
  }
}

/**
 * Transform Stream implementation for browsers
 */
export class TransformStream extends DuplexStream {
  constructor(options: { encoding?: string } = {}) {
    super(options);
    console.log('[Shim] TransformStream instance created');
  }

  _transform(
    chunk: unknown, 
    encoding: string, 
    callback: (error?: Error, data?: unknown) => void
  ): void {
    console.log('[Shim] TransformStream._transform called');
    callback(undefined, chunk);
  }

  _flush(callback: (error?: Error, data?: unknown) => void): void {
    console.log('[Shim] TransformStream._flush called');
    callback();
  }
}

/**
 * Passthrough Stream implementation for browsers
 */
export class PassThrough extends TransformStream {
  constructor(options: { encoding?: string } = {}) {
    super(options);
    console.log('[Shim] PassThrough instance created');
  }
}

// Create type aliases for compatibility
export type Readable = ReadableStream;
export type Writable = WritableStream;
export type Duplex = DuplexStream;
export type Transform = TransformStream;

// Add a method to check if the shim is being used
export function isShimActive(): boolean {
  console.log('[Shim] Stream shim usage detected');
  return true;
}

export default {
  Stream,
  Readable: ReadableStream,
  Writable: WritableStream,
  Duplex: DuplexStream,
  Transform: TransformStream,
  PassThrough,
  isShimActive
};
