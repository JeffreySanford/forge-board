import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

  /**
   * Get tile order for a specific user
   * @param userId The user identifier
   * @returns Observable with the tile order response
   */
  getTileOrder(userId: string): Observable<TileLayoutResponse> {
    // If we have a cached version, return it
    if (this.tileOrderCache[userId]) {
      return of({
        userId,
        order: this.tileOrderCache[userId],
        visibility: this.getDefaultVisibility(),
        lastModified: new Date().toISOString(),
        success: true
      });
    }
    
    // Otherwise call the API
    return this.http.get<TileLayoutResponse>(`${this.apiUrl}/tiles/${userId}/order`)
      .pipe(
        tap(response => {
          if (response.order && response.order.length) {
            // Cache the result
            this.tileOrderCache[userId] = response.order;
          }
        }),
        catchError(error => {
          console.error('Error fetching tile order:', error);
          // Return default order if API fails
          return of({ 
            userId, 
            order: this.defaultTileOrder,
            visibility: this.getDefaultVisibility(),
            lastModified: new Date().toISOString(),
            success: false
          });
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
    
    // Then persist to the backend
    return this.http.post<TileLayoutResponse>(
      `${this.apiUrl}/tiles/${userId}/order`, 
      { order: tileOrder }
    ).pipe(
      catchError(error => {
        console.error('Error saving tile order:', error);
        return of({ 
          userId, 
          order: tileOrder,
          visibility: this.getDefaultVisibility(),
          lastModified: new Date().toISOString(),
          success: false
        });
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
    return this.http.post<TileLayoutResponse>(
      `${this.apiUrl}/tiles/${userId}/visibility`,
      { visibility }
    ).pipe(
      catchError(error => {
        console.error('Error saving tile visibility:', error);
        return of({ 
          userId, 
          order: this.tileOrderCache[userId] || this.defaultTileOrder,
          visibility,
          lastModified: new Date().toISOString(),
          success: false
        });
      })
    );
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
      activity: true
    };
  }
}
