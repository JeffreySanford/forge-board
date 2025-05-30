import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  TileType,
  TileLayoutResponse,
} from '@forge-board/shared/api-interfaces';

@Injectable()
export class TileStateService {
  // Store tile orders and visibility as hot observables
  private tileOrders: Map<string, BehaviorSubject<TileType[]>> = new Map();
  private tileVisibility: Map<
    string,
    BehaviorSubject<Record<TileType, boolean>>
  > = new Map();

  constructor() {
    // Initialize with default values for a demo user
    const defaultOrder = [
      'metrics',
      'connection',
      'logs',
      'uptime',
      'activity',
    ] as TileType[];
    const defaultVisibility = {
      health: true,
      memory: true,
      metrics: true,
      connection: true,
      logs: true,
      uptime: true,
      activity: true,
      kanban: true,
    };
    this.tileOrders.set('user1', new BehaviorSubject<TileType[]>(defaultOrder));
    this.tileVisibility.set(
      'user1',
      new BehaviorSubject<Record<TileType, boolean>>(defaultVisibility)
    );
  }

  // Expose hot observable for tile order
  getTileOrder$(userId: string): Observable<TileType[]> {
    if (!this.tileOrders.has(userId)) {
      this.tileOrders.set(
        userId,
        new BehaviorSubject<TileType[]>([
          'metrics',
          'connection',
          'logs',
          'uptime',
          'activity',
        ])
      );
    }
    return this.tileOrders.get(userId)!.asObservable();
  }

  // Expose hot observable for tile visibility
  getTileVisibility$(userId: string): Observable<Record<TileType, boolean>> {
    if (!this.tileVisibility.has(userId)) {
      this.tileVisibility.set(
        userId,
        new BehaviorSubject<Record<TileType, boolean>>({
          health: true,
          memory: true,
          metrics: true,
          connection: true,
          logs: true,
          uptime: true,
          activity: true,
          kanban: true,
        })
      );
    }
    return this.tileVisibility.get(userId)!.asObservable();
  }

  // Return a snapshot response (not observable)
  getTileOrder(userId: string): TileLayoutResponse {
    if (!this.tileOrders.has(userId)) {
      this.tileOrders.set(
        userId,
        new BehaviorSubject<TileType[]>([
          'metrics',
          'connection',
          'logs',
          'uptime',
          'activity',
        ])
      );
    }
    if (!this.tileVisibility.has(userId)) {
      this.tileVisibility.set(
        userId,
        new BehaviorSubject<Record<TileType, boolean>>({
          health: true,
          memory: true,
          metrics: true,
          connection: true,
          logs: true,
          uptime: true,
          activity: true,
          kanban: true,
        })
      );
    }
    return {
      userId,
      order: this.tileOrders.get(userId)!.getValue(),
      visibility: this.tileVisibility.get(userId)!.getValue(),
      lastModified: new Date().toISOString(),
      success: true,
    };
  }

  setTileOrder(userId: string, order: TileType[]): TileLayoutResponse {
    if (!this.tileOrders.has(userId)) {
      this.tileOrders.set(userId, new BehaviorSubject<TileType[]>(order));
    } else {
      this.tileOrders.get(userId)!.next([...order]);
    }
    return this.getTileOrder(userId);
  }

  setTileVisibility(
    userId: string,
    visibility: Record<TileType, boolean>
  ): TileLayoutResponse {
    if (!this.tileVisibility.has(userId)) {
      this.tileVisibility.set(
        userId,
        new BehaviorSubject<Record<TileType, boolean>>(visibility)
      );
    } else {
      this.tileVisibility.get(userId)!.next({ ...visibility });
    }
    return this.getTileOrder(userId);
  }
}
