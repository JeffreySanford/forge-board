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
import { ErrorService } from '../services/error.service';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {

  constructor(private errorService: ErrorService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      // Retry the request up to 2 times if it fails
      retry(1),
      catchError((error: HttpErrorResponse) => {
        // Only log critical errors or server errors
        if (error.status === 0 || error.status >= 500) {
          console.error('API Error:', error);
          
          // For critical server errors, redirect to the error page
          if (error.status >= 500) {
            this.errorService.handleApiError(error);
          }
        } else if (error.status === 404) {
          // For 404 errors, log but don't redirect (the services handle fallbacks)
          console.error('API Error:', error);
        }
        
        // Always pass the error along to the component for handling
        return throwError(() => error);
      })
    );
  }
}
