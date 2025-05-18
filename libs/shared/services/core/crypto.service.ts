/**
 * Shared crypto implementation for both browser and Node.js environments
 */
import { Observable, from } from 'rxjs';

/**
 * Hash result interface
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  encoding: string;
}

/**
 * Random bytes result interface
 */
export interface RandomBytesResult {
  bytes: string;
  size: number;
  encoding?: string;
}

/**
 * Crypto service implementation - browser compatible
 */
export class CryptoService {
  /**
   * Create a hash with the specified algorithm
   * @param algorithm Hash algorithm to use (sha256, sha512, etc)
   * @param data Data to hash
   * @param encoding Output encoding (hex, base64, etc)
   */
  static createHash(algorithm: string, data: string, encoding: 'hex' | 'base64' = 'hex'): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const algorithmMap: Record<string, string> = {
        'sha1': 'SHA-1',
        'sha256': 'SHA-256',
        'sha384': 'SHA-384',
        'sha512': 'SHA-512',
      };

      const browserAlgorithm = algorithmMap[algorithm.toLowerCase()] || algorithm;
      
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(data);
      
      return window.crypto.subtle.digest(browserAlgorithm, dataArray)
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          
          if (encoding === 'hex') {
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          } else if (encoding === 'base64') {
            return btoa(String.fromCharCode(...hashArray));
          } else {
            throw new Error(`Unsupported encoding format: ${encoding}`);
          }
        });
    } else if (typeof require === 'function') {
      try {
        const crypto = require('crypto');
        return Promise.resolve(
          crypto.createHash(algorithm)
            .update(data)
            .digest(encoding)
        );
      } catch (error) {
        return Promise.reject(new Error(`Node.js crypto error: ${error instanceof Error ? error.message : String(error)}`));
      }
    } else {
      return Promise.reject(new Error('Crypto is not supported in this environment'));
    }
  }

  /**
   * Generate random bytes
   * @param size Number of bytes to generate
   * @param encoding Output encoding (hex, base64, etc)
   */
  static randomBytes(size: number, encoding?: 'hex' | 'base64'): Promise<string | Uint8Array> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(size);
      window.crypto.getRandomValues(bytes);
      
      if (!encoding) {
        return Promise.resolve(bytes);
      } else if (encoding === 'hex') {
        const hexString = Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        return Promise.resolve(hexString);
      } else if (encoding === 'base64') {
        const base64String = btoa(String.fromCharCode(...Array.from(bytes)));
        return Promise.resolve(base64String);
      } else {
        return Promise.reject(new Error(`Unsupported encoding format: ${encoding}`));
      }
    } else if (typeof require === 'function') {
      try {
        const crypto = require('crypto');
        const buffer = crypto.randomBytes(size);
        
        if (!encoding) {
          return Promise.resolve(buffer);
        } else {
          return Promise.resolve(buffer.toString(encoding));
        }
      } catch (error) {
        return Promise.reject(new Error(`Node.js crypto error: ${error instanceof Error ? error.message : String(error)}`));
      }
    } else {
      return Promise.reject(new Error('Crypto is not supported in this environment'));
    }
  }

  /**
   * Observable wrapper for createHash
   */
  static createHashObservable(algorithm: string, data: string, encoding: 'hex' | 'base64' = 'hex'): Observable<string> {
    return from(this.createHash(algorithm, data, encoding));
  }

  /**
   * Observable wrapper for randomBytes
   */
  static randomBytesObservable(size: number, encoding?: 'hex' | 'base64'): Observable<string | Uint8Array> {
    return from(this.randomBytes(size, encoding));
  }
}
