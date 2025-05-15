/**
 * Browser-compatible implementation of Node's crypto module
 */

// Define proper interface for browser's crypto object
interface BrowserCrypto {
  getRandomValues(array: Uint8Array): Uint8Array;
  subtle: SubtleCrypto;
  // Add other browser crypto properties as needed
}

// Define browser's SubtleCrypto interface methods we need
interface SubtleCrypto {
  digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
  // Add other SubtleCrypto methods as needed
}

// Define which algorithms are supported
type AlgorithmIdentifier = string | { name: string; [key: string]: unknown };

// Use proper type for BufferSource
type BufferSource = ArrayBufferView | ArrayBuffer;

console.log('[Shim] Crypto module loaded');

// Safely get the crypto object from window
const getBrowserCrypto = (): BrowserCrypto => {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  return window.crypto as BrowserCrypto;
};

/**
 * Create a hash object for the given algorithm
 */
export function createHash(algorithm: string): Hash {
  console.log(`[Crypto Shim] Creating hash with algorithm: ${algorithm}`);
  return new Hash(algorithm);
}

/**
 * Hash implementation using Web Crypto API
 */
class Hash {
  private algorithm: string;
  private data: Uint8Array[];
  
  constructor(algorithm: string) {
    // Map Node.js hash algorithms to Web Crypto API algorithms
    const algorithmMap: Record<string, string> = {
      'sha1': 'SHA-1',
      'sha256': 'SHA-256',
      'sha384': 'SHA-384',
      'sha512': 'SHA-512',
      // Add more algorithm mappings as needed
    };
    
    this.algorithm = algorithmMap[algorithm.toLowerCase()] || algorithm;
    this.data = [];
  }

  /**
   * Update the hash with new data
   */
  update(data: string | Buffer | Uint8Array): Hash {
    let buffer: Uint8Array;
    
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      buffer = encoder.encode(data);
    } else if (data instanceof Buffer) {
      buffer = new Uint8Array(data);
    } else {
      buffer = data;
    }
    
    this.data.push(buffer);
    return this;
  }

  /**
   * Complete the hash and return the result
   */
  digest(encoding?: string): Promise<string | Uint8Array> {
    // Combine all chunks of data
    const combinedData = this.combineData();
    
    // Use a Subject to properly transform Promise to Observable
    return new Promise<string | Uint8Array>((resolve, reject) => {
      try {
        const browserCrypto = getBrowserCrypto();
        
        // Use the Web Crypto API to calculate the hash
        browserCrypto.subtle.digest(this.algorithm, combinedData)
          .then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            
            if (!encoding || encoding === 'buffer') {
              resolve(new Uint8Array(hashBuffer));
            } else if (encoding === 'hex') {
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              resolve(hashHex);
            } else if (encoding === 'base64') {
              const hashBase64 = btoa(String.fromCharCode(...hashArray));
              resolve(hashBase64);
            } else {
              reject(new Error(`Unsupported encoding format: ${encoding}`));
            }
          })
          .catch(error => {
            reject(new Error(`Hash calculation failed: ${error.message}`));
          });
      } catch (error) {
        reject(new Error(`Web Crypto API error: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }

  /**
   * Combine all data chunks into a single Uint8Array
   */
  private combineData(): Uint8Array {
    // Calculate the total length of all data
    const totalLength = this.data.reduce((acc, curr) => acc + curr.length, 0);
    
    // Create a new buffer of the combined size
    const combined = new Uint8Array(totalLength);
    
    // Copy all data chunks into the new buffer
    let offset = 0;
    for (const chunk of this.data) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return combined;
  }
}

/**
 * Generate random bytes
 */
export function randomBytes(size: number): Uint8Array {
  const browserCrypto = getBrowserCrypto();
  const buffer = new Uint8Array(size);
  return browserCrypto.getRandomValues(buffer);
}

/**
 * Generate random values using Web Crypto API
 */
export function randomValues(array: Uint8Array): Uint8Array {
  const browserCrypto = getBrowserCrypto();
  return browserCrypto.getRandomValues(array);
}

// Export the default implementation
export default {
  createHash,
  randomBytes,
  randomValues
};
