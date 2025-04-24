/**
 * Tile type enum representing various dashboard tile types
 */
export type TileType = 'metrics' | 'connection' | 'logs' | 'uptime' | 'activity' | 'kablan'; // Removed `string` fallback to enforce stricter typing

export interface TileVisibility extends Partial<Record<TileType, boolean>> {} // Replaced invalid mapped type with a valid record type

export interface TileLayoutResponse {
  userId: string;
  order: TileType[];
  visibility?: TileVisibility;
  updatedAt?: string;
  lastModified?: string;
  success?: boolean;
}

export interface TileLayoutRequest {
  order: TileType[];
  visibility?: TileVisibility;
}

export interface TileResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Interface for tile components to implement for consistency
 */
export interface Tile {
  id: string;
  type: TileType;
  title: string;
  order: number;
  visible: boolean;
}

/**
 * Interface for drag events on tiles
 */
export interface TileDragEvent {
  previousIndex: number;
  currentIndex: number;
  tileType: TileType;
}
