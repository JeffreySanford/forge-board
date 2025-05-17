import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, shareReplay, tap, retry } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { BackendStatusService } from './backend-status.service';

// Import from our browser compatibility layer
import { os, path, crypto } from '../utils/browser-compat';

/**
 * System information interface
 */
export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  memory: {
    total: number;
    free: number;
    used: number;
    percentUsed: number;
  };
  uptime: number;
  timestamp: string;
  isShimData: boolean;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: string;
  cpuUsage: {
    loadAverage1min: number;
    loadAverage5min: number;
    loadAverage15min: number;
  };
  memoryUsage: {
    total: number;
    free: number;
    percentUsed: number;
  };
}

/**
 * Path operation response
 */
export interface PathResponse {
  original: string;
  result: string;
  timestamp: string;
  isShimData: boolean;
}

/**
 * Hash operation response
 */
export interface HashResponse {
  algorithm: string;
  hash: string;
  timestamp: string;
  isShimData: boolean;
}

/**
 * Unified system service for all operating system, file path, 
 * and system information functions
 */
@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private readonly apiUrl = `${environment.apiBaseUrl}/system`;
  
  // Cache system info for 1 minute
  private systemInfo$: Observable<SystemInfo> | null = null;
  private systemInfoRefreshTime = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute in ms

  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {}

  /**
   * Get system information
   * @returns Observable with system info
   */
  getSystemInfo(): Observable<SystemInfo> {
    const now = Date.now();
    
    // If we have a cached observable and it's still fresh, return it
    if (this.systemInfo$ && (now - this.systemInfoRefreshTime) < this.CACHE_DURATION) {
      return this.systemInfo$;
    }
    
    // Otherwise, fetch fresh data
    this.systemInfoRefreshTime = now;
    this.systemInfo$ = this.http.get<SystemInfo>(`${this.apiUrl}/info`).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      map(info => ({
        ...info,
        isShimData: false,
        timestamp: info.timestamp || new Date().toISOString()
      })),
      catchError(error => {
        console.warn('Server system info unavailable, falling back to shim', error);
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        // Create system info from browser environment
        return of({
          platform: os.platform(),
          arch: os.arch(),
          hostname: 'browser', // Browser doesn't have hostname
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
          },
          uptime: os.uptime(),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      }),
      retry(1),
      shareReplay(1)
    );
    
    return this.systemInfo$;
  }

  /**
   * Get performance metrics
   * @returns Observable with performance metrics
   */
  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`${this.apiUrl}/performance`).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(error => {
        console.warn('Server performance metrics unavailable, using estimated values', error);
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        // Return estimated metrics in browser environment
        return this.getSystemInfo().pipe(
          map(info => ({
            timestamp: new Date().toISOString(),
            cpuUsage: {
              loadAverage1min: 0,
              loadAverage5min: 0,
              loadAverage15min: 0
            },
            memoryUsage: {
              total: info.memory.total,
              free: info.memory.free,
              percentUsed: info.memory.percentUsed
            }
          }))
        );
      })
    );
  }
  
  /**
   * Create a hash using the specified algorithm
   * @param data Data to hash
   * @param algorithm Hash algorithm (e.g., 'sha256')
   * @returns Observable with hash response
   */
  createHash(data: string, algorithm = 'sha256'): Observable<HashResponse> {
    return this.http.post<HashResponse>(`${this.apiUrl}/hash`, { data, algorithm }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('crypto', true, false)),
      catchError(error => {
        console.warn('Server crypto unavailable, falling back to browser implementation', error);
        this.backendStatusService.updateGatewayStatus('crypto', false, true);
        
        return from(crypto.createHash(algorithm, data, 'hex')).pipe(
          map(hash => ({
            algorithm,
            hash,
            timestamp: new Date().toISOString(),
            isShimData: true
          }))
        );
      })
    );
  }
  
  /**
   * Join path segments
   * @param segments Path segments to join
   * @returns Observable with path response
   */
  joinPaths(segments: string[]): Observable<PathResponse> {
    return this.http.post<PathResponse>(`${this.apiUrl}/path/join`, { segments }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(() => {
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          original: segments.join(','),
          result: path.join(...segments),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Normalize a path
   * @param pathString Path to normalize
   * @returns Observable with path response
   */
  normalizePath(pathString: string): Observable<PathResponse> {
    return this.http.post<PathResponse>(`${this.apiUrl}/path/normalize`, { path: pathString }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(() => {
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          original: pathString,
          result: path.normalize(pathString),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Get path basename
   * @param pathString Path to process
   * @param ext Optional extension to remove
   * @returns Observable with path response
   */
  getBasename(pathString: string, ext?: string): Observable<PathResponse> {
    return this.http.post<PathResponse>(`${this.apiUrl}/path/basename`, { path: pathString, ext }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(() => {
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          original: pathString,
          result: path.basename(pathString, ext),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Get path dirname
   * @param pathString Path to process
   * @returns Observable with path response
   */
  getDirname(pathString: string): Observable<PathResponse> {
    return this.http.post<PathResponse>(`${this.apiUrl}/path/dirname`, { path: pathString }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(() => {
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          original: pathString,
          result: path.dirname(pathString),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
  
  /**
   * Get path extension
   * @param pathString Path to process 
   * @returns Observable with path response
   */
  getExtname(pathString: string): Observable<PathResponse> {
    return this.http.post<PathResponse>(`${this.apiUrl}/path/extname`, { path: pathString }).pipe(
      tap(() => this.backendStatusService.updateGatewayStatus('system', true, false)),
      catchError(() => {
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        return of({
          original: pathString,
          result: path.extname(pathString),
          timestamp: new Date().toISOString(),
          isShimData: true
        });
      })
    );
  }
}
