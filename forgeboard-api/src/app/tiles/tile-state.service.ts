import { Injectable } from '@nestjs/common';
import { TileType, TileLayoutResponse } from '@forge-board/shared/api-interfaces';

@Injectable()
export class TileStateService {
  // Convert arrays to Maps to enable has() and get() methods
  private tileOrders: Map<string, TileType[]> = new Map();
  private tileVisibility: Map<string, Record<TileType, boolean>> = new Map();

  constructor() {
    // Initialize with default values
    const defaultOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'] as TileType[];
    const defaultVisibility = {
      health: true,  // Added health
      memory: true,  // Added memory
      metrics: true,
      connection: true,
      logs: true,
      uptime: true,
      activity: true,
      kablan: true
    };
    
    this.tileOrders.set('user1', defaultOrder);
    this.tileVisibility.set('user1', defaultVisibility);
  }

  getTileOrder(userId: string) {
    if (!this.tileOrders.has(userId)) {
      // Default tile order
      const defaultOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'] as TileType[];
      const defaultVisibility = {
        health: true,  // Added health
        memory: true,  // Added memory
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true,
        kablan: true
      };
      
      this.tileOrders.set(userId, defaultOrder);
      this.tileVisibility.set(userId, defaultVisibility);
    }
    
    return {
      userId,
      order: this.tileOrders.get(userId),
      visibility: this.tileVisibility.get(userId) || {
        health: true,  // Added health
        memory: true,  // Added memory
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true,
        kablan: true  // Add the missing 'kablan' property
      },
      lastModified: new Date().toISOString(),
      success: true
    };
  }

  setTileOrder(userId: string, order: TileType[]): TileLayoutResponse {
    // Save order in memory
    this.tileOrders.set(userId, [...order]);
    
    return {
      userId,
      order: this.tileOrders.get(userId),
      visibility: this.tileVisibility.get(userId) || {
        health: true,  // Added health
        memory: true,  // Added memory
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true,
        kablan: true  // Add the missing 'kablan' property
      },
      lastModified: new Date().toISOString(),
      success: true
    };
  }

  setTileVisibility(userId: string, visibility: Record<TileType, boolean>): TileLayoutResponse {
    // Save visibility in memory
    this.tileVisibility.set(userId, {...visibility});
    
    return {
      userId,
      order: this.tileOrders.get(userId) || ['metrics', 'connection', 'logs', 'uptime', 'activity'],
      visibility: this.tileVisibility.get(userId) || {
        health: true,  // Added health
        memory: true,  // Added memory
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true,
        kablan: true  // Add the missing 'kablan' property
      },
      lastModified: new Date().toISOString(),
      success: true
    };
  }
}
