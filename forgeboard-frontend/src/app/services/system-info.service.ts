import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import * as osShim from '@shims/os';
import { BackendStatusService } from './backend-status.service';

interface SystemInfo {
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
}

interface PerformanceMetrics {
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

@Injectable({
  providedIn: 'root'
})
export class SystemInfoService {
  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService
  ) {}

  /**
   * Get system information from server when possible
   */
  getSystemInfo(): Observable<SystemInfo> {
    const url = `${environment.apiUrl}/system/info`;
    
    return this.http.get<SystemInfo>(url).pipe(
      tap(() => {
        this.backendStatusService.updateGatewayStatus('system', true, false);
      }),
      catchError(error => {
        console.warn('Server system info unavailable, falling back to shim', error);
        this.backendStatusService.updateGatewayStatus('system', false, true);
        
        // Create a minimal system info object from shims
        const systemInfo: SystemInfo = {
          platform: osShim.platform(),
          arch: osShim.arch(),
          hostname: osShim.hostname(),
          memory: {
            total: osShim.totalmem(),
            free: osShim.freemem(),
            used: osShim.totalmem() - osShim.freemem(),
            percentUsed: ((osShim.totalmem() - osShim.freemem()) / osShim.totalmem()) * 100
          },
          uptime: osShim.uptime()
        };
        
        return of(systemInfo);
      })
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    const url = `${environment.apiUrl}/system/performance`;
    
    return this.http.get<PerformanceMetrics>(url).pipe(
      catchError(error => {
        console.warn('Server performance metrics unavailable, using default values', error);
        
        return of({
          timestamp: new Date().toISOString(),
          cpuUsage: {
            loadAverage1min: 0,
            loadAverage5min: 0,
            loadAverage15min: 0
          },
          memoryUsage: {
            total: 8000000000, // 8GB default
            free: 4000000000,  // 4GB default
            percentUsed: 50    // 50% default
          }
        });
      })
    );
  }
}
