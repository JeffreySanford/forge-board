import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TypeDiagnosticsService } from '../services/type-diagnostics.service';

@Injectable()
export class TypeValidationInterceptor implements HttpInterceptor {
  // Map of URL patterns to expected response types
  private urlTypeMap: Record<string, string> = {
    '/api/metrics': 'MetricData',
    '/api/diagnostics/health': 'HealthData',
    '/api/logs$': 'LogQueryResponse',
    // Add more mappings as needed
  };

  // Use injector for lazy loading to break circular dependency
  constructor(private injector: Injector) {}

  // Lazy getter for TypeDiagnosticsService to avoid circular dependency
  private get typeDiagnostics(): TypeDiagnosticsService | null {
    try {
      return this.injector.get(TypeDiagnosticsService);
    } catch (e) {
      console.warn('TypeDiagnosticsService not available:', e);
      return null;
    }
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          const url = request.url;
          // Find matching type for this URL
          const typeName = this.findMatchingType(url);
          
          if (typeName && this.typeDiagnostics) {
            try {
              // Use validateType, but safely get the service first
              const callerInfo = `HTTP ${request.method} ${url}`;
              this.typeDiagnostics.validateType(event.body, typeName, callerInfo);
            } catch (error) {
              // Log error without using LoggerService
              console.error(`Response type validation failed for ${url}:`, error);
            }
          }
        }
        return event;
      })
    );
  }

  /**
   * Find matching type based on URL pattern
   */
  private findMatchingType(url: string): string | null {
    for (const pattern in this.urlTypeMap) {
      if (url.includes(pattern)) {
        return this.urlTypeMap[pattern];
      }
    }
    return null;
  }
}
