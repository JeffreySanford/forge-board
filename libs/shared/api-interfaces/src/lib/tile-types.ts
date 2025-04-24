/**
 * Tile type enum representing various dashboard tile types
 */
export type TileType = 'metrics' | 'connection' | 'logs' | 'uptime' | 'activity' | 'kablan';

export interface TileLayoutResponse {
  userId: string;
  order: TileType[];
  visibility: Record<TileType, boolean>;
  lastModified: string;
  success: boolean;
}

export interface TileLayoutRequest {
  order: TileType[];
  visibility?: TileVisibility;
}

// Add the missing TileVisibility type
export type TileVisibility = Record<TileType, boolean>;

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
