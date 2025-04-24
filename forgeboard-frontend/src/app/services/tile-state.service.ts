import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, retry } from 'rxjs/operators';
import { TileType, TileLayoutResponse } from '../models/tile.model';

@Injectable({
  providedIn: 'root'
})
export class TileStateService {
  private readonly apiUrl = 'http://localhost:3000/api';
  
  // Default tile order in case the API fails
  private defaultTileOrder: TileType[] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
  
  // In-memory cache of tile orders by user
  private tileOrderCache: Record<string, TileType[]> = {};
  
  // Flag to track if backend is available
  private isBackendAvailable = true;

  constructor(private http: HttpClient) {
    // Perform initial availability check
    this.checkBackendAvailability();
  }

  /**
   * Check if backend is available
   */
  private checkBackendAvailability(): void {
    this.http.get<{status: string}>(`${this.apiUrl}/status`)
      .pipe(
        catchError(() => {
          this.isBackendAvailable = false;
          console.warn('Backend API is not available. Using cached data and defaults.');
          return of({status: 'unavailable'});
        })
      )
      .subscribe(response => {
        this.isBackendAvailable = response.status === 'ok';
      });
  }

  /**
   * Get tile order for a specific user
   * @param userId The user identifier
   * @returns Observable with the tile order response
   */
  getTileOrder(userId: string): Observable<TileLayoutResponse> {
    // If we have a cached version, return it immediately for responsive UI
    if (this.tileOrderCache[userId]) {
      const cachedOrder = [...this.tileOrderCache[userId]];
      return of(this.createSuccessResponse(userId, cachedOrder));
    }
    
    // If backend is known to be unavailable, return defaults immediately
    if (!this.isBackendAvailable) {
      return of(this.createSuccessResponse(userId, [...this.defaultTileOrder]));
    }
    
    // Otherwise call the API
    return this.http.get<TileLayoutResponse>(`${this.apiUrl}/tiles/${userId}/order`)
      .pipe(
        retry(1),
        tap(response => {
          if (response.order && response.order.length) {
            // Cache the result
            this.tileOrderCache[userId] = [...response.order];
          }
        }),
        catchError(error => {
          console.error('Error fetching tile order:', error);
          
          // Mark backend as unavailable on server errors
          if (error instanceof HttpErrorResponse) {
            if (error.status === 0 || error.status >= 500) {
              this.isBackendAvailable = false;
            }
          }
          
          // Return default order if API fails
          return of(this.createSuccessResponse(userId, [...this.defaultTileOrder]));
        })
      );
  }

  /**
   * Set tile order for a specific user
   * @param userId The user identifier
   * @param tileOrder The new tile order
   * @returns Observable with the result
   */
  setTileOrder(userId: string, tileOrder: TileType[]): Observable<TileLayoutResponse> {
    // Cache immediately for responsive UI
    this.tileOrderCache[userId] = [...tileOrder];
    
    // If backend is unavailable, just return success with cached data
    if (!this.isBackendAvailable) {
      return of(this.createSuccessResponse(userId, [...tileOrder]));
    }
    
    // Then persist to the backend
    return this.http.post<TileLayoutResponse>(
      `${this.apiUrl}/tiles/${userId}/order`, 
      { order: tileOrder }
    ).pipe(
      retry(1),
      catchError(error => {
        console.error('Error saving tile order:', error);
        
        // Mark backend as unavailable on server errors
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0 || error.status >= 500) {
            this.isBackendAvailable = false;
          }
        }
        
        // Return with the cached order
        return of(this.createSuccessResponse(userId, [...tileOrder], false));
      })
    );
  }

  /**
   * Set visibility for tiles by type
   * @param userId The user identifier
   * @param visibility Record of visibility by tile type
   * @returns Observable with the result
   */
  setTileVisibility(
    userId: string, 
    visibility: Record<TileType, boolean>
  ): Observable<TileLayoutResponse> {
    // If backend is unavailable, just return success with current data
    if (!this.isBackendAvailable) {
      return of({
        userId,
        order: this.tileOrderCache[userId] || [...this.defaultTileOrder],
        visibility,
        lastModified: new Date().toISOString(),
        success: true
      });
    }
    
    return this.http.post<TileLayoutResponse>(
      `${this.apiUrl}/tiles/${userId}/visibility`,
      { visibility }
    ).pipe(
      retry(1),
      catchError(error => {
        console.error('Error saving tile visibility:', error);
        
        // Mark backend as unavailable on server errors
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0 || error.status >= 500) {
            this.isBackendAvailable = false;
          }
        }
        
        return of({
          userId, 
          order: this.tileOrderCache[userId] || [...this.defaultTileOrder],
          visibility,
          lastModified: new Date().toISOString(),
          success: false
        });
      })
    );
  }

  /**
   * Create a standardized success response object
   */
  private createSuccessResponse(
    userId: string, 
    order: TileType[], 
    success: boolean = true
  ): TileLayoutResponse {
    return {
      userId,
      order,
      visibility: this.getDefaultVisibility(),
      lastModified: new Date().toISOString(),
      success
    };
  }

  /**
   * Get default visibility settings for all tile types
   */
  private getDefaultVisibility(): Record<TileType, boolean> {
    return {
      metrics: true,
      connection: true,
      logs: true,
      uptime: true,
      activity: true,
      kablan: true
    };
  }
}
