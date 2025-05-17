import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SocketInfo } from '@forge-board/shared/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private apiUrl = '/api/sockets';

  constructor(private http: HttpClient) { }

  getActiveSockets(): Observable<SocketInfo[]> {
    return this.http.get<any>(`${this.apiUrl}/active`)
      .pipe(
        map(response => {
          // More robust response handling
          if (Array.isArray(response)) {
            return response;
          } else if (response && typeof response === 'object') {
            if ('data' in response && Array.isArray(response.data)) {
              return response.data;
            } else if ('activeSockets' in response && Array.isArray(response.activeSockets)) {
              return response.activeSockets;
            }
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API error:', error);
    
    // If we receive a 200 OK but can't parse the response, it's likely malformed JSON
    if (error.status === 200) {
      console.warn('Received a 200 status code but encountered an error processing the response');
      return throwError(() => new Error('Error parsing server response'));
    }
    
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
