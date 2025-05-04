import { Injectable } from '@nestjs/common';
import { TileType, TileLayoutResponse } from '@forge-board/shared/api-interfaces';

@Injectable()
export class TileStateService {
  // In-memory storage for tile states
  private tileStates: Record<string, TileLayoutResponse> = {};

  constructor() {
    // Initialize with default state
    this.tileStates['user1'] = {
      userId: 'user1',
      order: ['metrics', 'connection', 'logs', 'uptime', 'activity'] as TileType[],
      visibility: {
        health: true,  // Added health
        memory: true,  // Added memory
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true,
        kablan: true
      },
      lastModified: new Date().toISOString(),
      success: true  // Add success property
    };
  }

  getTileOrder(userId: string): TileLayoutResponse {
    // Return existing state or create a new one with defaults
    if (!this.tileStates[userId]) {
      this.tileStates[userId] = {
        userId,
        order: ['metrics', 'connection', 'logs', 'uptime', 'activity'] as TileType[],
        visibility: {
          health: true,  // Added health
          memory: true,  // Added memory
          metrics: true,
          connection: true,
          logs: true,
          uptime: true,
          activity: true,
          kablan: true
        },
        lastModified: new Date().toISOString(),
        success: true  // Add success property
      };
    }
    
    return this.tileStates[userId];
  }

  setTileOrder(userId: string, order: TileType[]): TileLayoutResponse {
    // Ensure user state exists
    if (!this.tileStates[userId]) {
      this.getTileOrder(userId);
    }
    
    // Update the order
    this.tileStates[userId].order = order;
    this.tileStates[userId].lastModified = new Date().toISOString();
    
    return this.tileStates[userId];
  }

  setTileVisibility(userId: string, visibility: Record<TileType, boolean>): TileLayoutResponse {
    // Ensure user state exists
    if (!this.tileStates[userId]) {
      this.getTileOrder(userId);
    }
    
    // Update visibility
    this.tileStates[userId].visibility = {
      ...this.tileStates[userId].visibility,
      ...visibility
    };
    this.tileStates[userId].lastModified = new Date().toISOString();
    
    return this.tileStates[userId];
  }
}
