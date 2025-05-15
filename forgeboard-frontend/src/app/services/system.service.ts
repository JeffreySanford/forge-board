import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { BackendStatusService } from './backend-status.service';

// Import browser shims as fallback
import * as osShim from '../shims/os';
import * as pathShim from '../shims/path';
import * as cryptoShim from '../shims/crypto';

export interface SystemInfoResponse {
  platform: string;
  arch: string;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  timestamp: string;
  isShimData?: boolean;
}

export interface HashResponse {
  algorithm: string;
  hash: string;
  timestamp: string;
  isShimData?: boolean;
}

export interface PathResponse {
  original: string;
  normalized: string;
  timestamp: string;
  isShimData?: boolean;
}

export interface JoinPathsResponse {
  segments: string[];
  joined: string;
  timestamp: string;
  isShimData?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private readonly apiUrl = `${environment.apiBaseUrl}/system`;
  
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {}
  
  /**
   * Get system information from server with fallback to browser shims
   */
  getSystemInfo(): Observable<SystemInfoResponse> {
    return this.http.get<SystemInfoResponse>(`${this.apiUrl}/info`).pipe(
      catchError(error => {
        // Fallback to browser shim
        console.warn('Backend system info unavailable, using browser shims', error);
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          platform: osShim.platform(),
          arch: osShim.arch(),
          totalMemory: osShim.totalmem(),
          freeMemory: osShim.freemem(),
          uptime: osShim.uptime(),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Generate hash with backend or fallback to browser implementation
   */
  generateHash(data: string, algorithm = 'sha256'): Observable<HashResponse> {
    return this.http.get<HashResponse>(`${this.apiUrl}/hash`, {
      params: { data, algorithm }
    }).pipe(
      catchError(error => {
        console.warn('Backend hash generation unavailable, using browser shims', error);
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        // Use browser shim implementation
        return this.generateHashLocally(data, algorithm);
      })
    );
  }
  
  /**
   * Local implementation of hash generation using browser shims
   */
  private generateHashLocally(data: string, algorithm = 'sha256'): Observable<HashResponse> {
    return new Observable<HashResponse>(observer => {
      try {
        const hash = cryptoShim.createHash(algorithm);
        hash.update(data);
        
        // For modern browsers, we can use async digest
        if (typeof hash.digest === 'function') {
          const digestPromise = hash.digest('hex');
          
          if (digestPromise instanceof Promise) {
            digestPromise.then((result: string | Uint8Array) => {
              if (typeof result === 'string') {
                observer.next({
                  algorithm,
                  hash: result,
                  timestamp: new Date().toISOString(),
                  isShimData: true
                });
                observer.complete();
              } else {
                // This case should not be hit if 'hex' encoding was requested and shim works as intended
                observer.error(new Error('Crypto shim: Expected string for hex digest, received Uint8Array.'));
              }
            }).catch((err: Error | any) => { // Make catch more general or use unknown
              observer.error(err);
            });
          } else {
            // Handle case where digest returns string directly (older or different shim behavior)
            if (typeof digestPromise === 'string') {
              observer.next({
                algorithm,
                hash: digestPromise,
                timestamp: new Date().toISOString(),
                isShimData: true
              });
              observer.complete();
            } else {
               observer.error(new Error('Hash digest function did not return a Promise or a string.'));
            }
          }
        } else {
          observer.error(new Error('Hash digest function not available'));
        }
      } catch (err) {
        observer.error(err);
      }
    });
  }
  
  /**
   * Normalize a path with backend or fallback
   */
  normalizePath(pathString: string): Observable<PathResponse> {
    return this.http.get<PathResponse>(`${this.apiUrl}/path/normalize`, {
      params: { path: pathString }
    }).pipe(
      catchError(() => {
        // Fallback to browser shim
        return of({
          original: pathString,
          normalized: pathShim.normalize(pathString),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Join paths with backend or fallback
   */
  joinPaths(paths: string[]): Observable<JoinPathsResponse> {
    return this.http.get<JoinPathsResponse>(`${this.apiUrl}/path/join`, {
      params: { paths: paths.join(',') }
    }).pipe(
      catchError(() => {
        // Fallback to browser shim
        return of({
          segments: paths,
          joined: pathShim.join(...paths),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
}
