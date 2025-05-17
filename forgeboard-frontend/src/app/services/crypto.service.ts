import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap, shareReplay } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { BackendStatusService } from './backend-status.service';
import { CryptoService as SharedCryptoService } from '@forge-board/shared/api-interfaces';
import { crypto } from '../utils/browser-compat';

/**
 * Unified crypto service that combines the functionality of
 * server-crypto.service.ts and crypto.service.ts
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/crypto`;
  
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {}

  /**
   * Create a hash using the server when possible with fallback to secure implementation
   * @param algorithm Hash algorithm to use (sha256, sha512, etc)
   * @param data Data to hash
   * @param encoding Output encoding (hex, base64, etc)
   * @returns Observable with the hash string
   */
  createHash(algorithm: string, data: string, encoding: 'hex' | 'base64' = 'hex'): Observable<string> {
    return this.http.post<{ hash: string }>(`${this.apiUrl}/hash`, { algorithm, data, encoding }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('crypto', true, false)),
      map(response => response.hash),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to secure implementation', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        // Use the shared crypto implementation
        return from(SharedCryptoService.createHash(algorithm, data, encoding))
          .pipe(
            catchError(shimError => {
              console.error('Crypto implementation error:', shimError);
              throw shimError;
            })
          );
      }),
      shareReplay(1)
    );
  }

  /**
   * Generate random bytes using the server when possible
   * @param size Number of bytes to generate
   * @param encoding Output encoding (hex, base64, etc)
   * @returns Observable with random bytes as string
   */
  randomBytes(size: number, encoding?: 'hex' | 'base64'): Observable<string> {
    return this.http.post<{ bytes: string }>(`${this.apiUrl}/random`, { size, encoding }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('crypto', true, false)),
      map(response => response.bytes),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to secure implementation', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        // Use the shared crypto implementation
        return from(SharedCryptoService.randomBytes(size, encoding))
          .pipe(
            map(result => {
              if (typeof result === 'string') {
                return result;
              }
              // Convert Uint8Array to string if needed
              return Buffer.from(result).toString(encoding || 'hex');
            }),
            catchError(shimError => {
              console.error('Crypto implementation error:', shimError);
              throw shimError;
            })
          );
      }),
      shareReplay(1)
    );
  }
  
  /**
   * Generate a random string of specified length
   * @param length Length of the random string
   * @param encoding Encoding to use (defaults to hex)
   * @returns Observable with random string
   */
  randomString(length: number, encoding: 'hex' | 'base64' = 'hex'): Observable<string> {
    // Calculate bytes needed based on encoding
    const bytesNeeded = encoding === 'hex' ? Math.ceil(length / 2) : Math.ceil((length * 3) / 4);
    
    return this.randomBytes(bytesNeeded, encoding).pipe(
      map(result => result.substring(0, length))
    );
  }

  /**
   * Get crypto object that's Web Crypto API compatible
   * Ensures we're using the secure native implementation
   */
  getWebCrypto(): Crypto {
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto;
    }
    throw new Error('Web Crypto API is not available in this environment');
  }
  
  /**
   * Create HMAC using the server when possible
   * @param algorithm Hash algorithm to use (sha256, sha512, etc)
   * @param data Data to hash
   * @param key Key to use for HMAC
   * @param encoding Output encoding (hex, base64, etc)
   * @returns Observable with the HMAC string
   */
  createHmac(
    algorithm: string, 
    data: string, 
    key: string, 
    encoding: 'hex' | 'base64' = 'hex'
  ): Observable<string> {
    return this.http.post<{ hmac: string }>(`${this.apiUrl}/hmac`, { 
      algorithm, data, key, encoding 
    }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('crypto', true, false)),
      map(response => response.hmac),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to secure implementation', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        // Use the shared crypto implementation
        return from(SharedCryptoService.createHmac(algorithm, data, key, encoding))
          .pipe(
            catchError(shimError => {
              console.error('Crypto implementation error:', shimError);
              throw shimError;
            })
          );
      }),
      shareReplay(1)
    );
  }
}

// Create a singleton instance for use in non-Angular contexts
const cryptoServiceInstance = new CryptoService(
  // These will be set by Angular's DI system when used in components
  null as any,
  null as any
);

export { cryptoServiceInstance as cryptoService };
