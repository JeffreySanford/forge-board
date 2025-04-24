import { Injectable } from '@nestjs/common';

@Injectable()
export class TilesService {
  private tileOrderMap: Map<string, any> = new Map();
  private tileVisibilityMap: Map<string, any> = new Map();

  getTileOrder(userId: string) {
    if (!this.tileOrderMap.has(userId)) {
      // Default tile order
      const defaultOrder = ['metrics', 'connection', 'logs', 'uptime', 'activity'];
      const defaultVisibility = {
        metrics: true,
        connection: true,
        logs: true,
        uptime: true,
        activity: true
      };

      return {
        userId,
        order: defaultOrder,
        visibility: defaultVisibility,
        lastModified: new Date().toISOString(),
        success: true
      };
    }

    return {
      userId,
      order: this.tileOrderMap.get(userId),
      visibility: this.tileVisibilityMap.get(userId) || {
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

  setTileOrder(userId: string, order: string[]) {
    this.tileOrderMap.set(userId, order);
    return {
      userId,
      order,
      lastModified: new Date().toISOString(),
      success: true
    };
  }

  setTileVisibility(userId: string, visibility: Record<string, boolean>) {
    this.tileVisibilityMap.set(userId, visibility);
    return {
      userId,
      visibility,
      order: this.tileOrderMap.get(userId) || ['metrics', 'connection', 'logs', 'uptime', 'activity'],
      lastModified: new Date().toISOString(),
      success: true
    };
  }
}
