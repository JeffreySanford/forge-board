import { Injectable } from '@nestjs/common';

@Injectable()
export class TileStateService {
  private userTileOrder: Record<string, string[]> = {};

  getTileOrder(userId: string): string[] {
    return this.userTileOrder[userId] || [];
  }

  setTileOrder(userId: string, order: string[]) {
    this.userTileOrder[userId] = order;
  }
}
