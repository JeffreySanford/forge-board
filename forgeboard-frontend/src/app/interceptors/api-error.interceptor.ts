import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add retry logic for idempotent requests
    const isIdempotent = request.method === 'GET' || request.method === 'HEAD';
    
    return next.handle(request).pipe(
      // Only retry idempotent requests to avoid side effects
      isIdempotent ? retry(1) : retry(0),
      catchError((error: HttpErrorResponse) => {
        // Log the error for debugging
        console.error('API Error:', error);
        
        // You could add notification service here to show user-friendly messages
        
        // Rethrow the error for downstream handling
        return throwError(() => error);
      })
    );
  }
}
