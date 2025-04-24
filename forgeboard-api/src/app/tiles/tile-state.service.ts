import { Injectable, Logger } from '@nestjs/common';
import { TileLayoutResponse, TileType } from '@forge-board/shared/api-interfaces';

@Injectable()
export class TileStateService {
  private readonly logger = new Logger(TileStateService.name);
  
  // In-memory storage for tile orders (would be a database in production)
  private tileOrders: Record<string, TileType[]> = {};
  private tileVisibility: Record<string, Record<TileType, boolean>> = {};

  constructor() {
    // Add some default values
    this.tileOrders['user1'] = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
    this.tileVisibility['user1'] = {
      metrics: true,
      connection: true,
      logs: true,
      uptime: true,
      activity: true
    };
  }

  getTileOrder(userId: string): TileLayoutResponse {
    this.logger.log(`Getting tile order for user: ${userId}`);
    
    // Return default order if no custom order is saved
    const order = this.tileOrders[userId] || ['metrics', 'connection', 'logs', 'uptime', 'activity'];
    const visibility = this.tileVisibility[userId] || {
      metrics: true,
      connection: true,
      logs: true,
      uptime: true,
      activity: true
    };
    
    return {
      userId,
      order,
      visibility,
      lastModified: new Date().toISOString(),
      success: true
    };
  }

  setTileOrder(userId: string, order: TileType[]): TileLayoutResponse {
    this.logger.log(`Setting tile order for user ${userId}: ${order.join(', ')}`);
    
    // Save order in memory
    this.tileOrders[userId] = [...order];
    
    return {
      userId,
      order: this.tileOrders[userId],
      visibility: this.tileVisibility[userId] || {
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true
      },
      lastModified: new Date().toISOString(),
      success: true
    };
  }

  setTileVisibility(userId: string, visibility: Record<TileType, boolean>): TileLayoutResponse {
    this.logger.log(`Setting tile visibility for user ${userId}`);
    
    // Save visibility in memory
    this.tileVisibility[userId] = {...visibility};
    
    return {
      userId,
      order: this.tileOrders[userId] || ['metrics', 'connection', 'logs', 'uptime', 'activity'],
      visibility: this.tileVisibility[userId],
      lastModified: new Date().toISOString(),
      success: true
    };
  }
}
