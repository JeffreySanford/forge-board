import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private router: Router) {}

  /**
   * Handle API errors by redirecting to the appropriate error page
   */
  handleApiError(error: HttpErrorResponse, path?: string): void {
    // Log error details in a structured format for easier debugging
    console.error(`API Error [${error.status}]: ${this.getErrorMessage(error.status)} - ${error.message}`, {
      url: error.url,
      statusText: error.statusText,
      timestamp: new Date().toISOString(),
      errorDetails: error.error
    });
    
    // Get error details
    const code = error.status || 500;
    const message = error.statusText || this.getErrorMessage(code);
    const timestamp = new Date().toISOString();
    const errorPath = path || error.url || window.location.pathname;
    
    // Navigate to error page with details
    this.router.navigate(['/404'], {
      queryParams: {
        code,
        message,
        path: errorPath,
        timestamp
      }
    });
  }

  /**
   * Get a user-friendly message for common HTTP status codes
   */
  private getErrorMessage(code: number): string {
    switch (code) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 405: return 'Method Not Allowed';
      case 408: return 'Request Timeout';
      case 500: return 'Internal Server Error';
      case 501: return 'Not Implemented';
      case 502: return 'Bad Gateway';
      case 503: return 'Service Unavailable';
      case 504: return 'Gateway Timeout';
      default: return 'Unknown Error';
    }
  }

  /**
   * Navigate to a 500 error page with specific message
   */
  navigateToServerError(message: string = 'Internal Server Error'): void {
    this.router.navigate(['/404'], {
      queryParams: {
        code: 500,
        message,
        path: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    });
  }
}
