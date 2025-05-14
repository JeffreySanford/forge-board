import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import * as cryptoShim from '@shims/crypto';
import { BackendStatusService } from './backend-status.service';

interface HashResponse {
  hash: string;
}

interface RandomBytesResponse {
  bytes: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServerCryptoService {
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {}

  /**
   * Create a hash using the server when possible
   */
  createHash(algorithm: string, data: string, encoding: 'hex' | 'base64' = 'hex'): Observable<string> {
    const url = `${environment.apiBaseUrl}/crypto/hash`;
    
    return this.http.post<HashResponse>(url, { algorithm, data, encoding }).pipe(
      map(response => response.hash),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to shim', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        try {
          // Use the crypto shim as fallback
          const hash = cryptoShim.createHash(algorithm);
          hash.update(data);
          
          // Convert Promise to Observable using from() instead of of()
          return from(hash.digest(encoding).then((result: string | Uint8Array) => {
            // Convert to string if it's a Uint8Array
            if (result instanceof Uint8Array) {
              return new TextDecoder().decode(result);
            }
            return result as string;
          }));
        } catch (shimError) {
          console.error('Crypto shim error:', shimError);
          throw shimError;
        }
      })
    );
  }

  /**
   * Generate random bytes using the server when possible
   */
  randomBytes(size: number, encoding?: 'hex' | 'base64'): Observable<string> {
    const url = `${environment.apiBaseUrl}/crypto/random`;
    
    return this.http.post<RandomBytesResponse>(url, { size, encoding }).pipe(
      map(response => response.bytes),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to shim', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        try {
          // Use the crypto shim as fallback
          const bytes = cryptoShim.randomBytes(size);
          return of(Buffer.from(bytes).toString(encoding || 'hex'));
        } catch (shimError) {
          console.error('Crypto shim error:', shimError);
          throw shimError;
        }
      })
    );
  }
}
