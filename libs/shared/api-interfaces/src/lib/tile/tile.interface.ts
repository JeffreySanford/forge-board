/**
 * Available tile types
 */
export type TileType = 'metrics' | 'connection' | 'logs' | 'uptime' | 'activity' | 'health' | 'memory' | 'network' | 'kanban';

/**
 * Tile configuration interface
 */
export interface Tile {
  id: string;
  type: TileType;
  title: string;
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  config?: Record<string, unknown>;
  visible?: boolean;
}

/**
 * Event generated when a tile is dragged
 */
export interface TileDragEvent {
  tileId: string;
  sourcePosition: {
    x: number;
    y: number;
  };
  targetPosition: {
    x: number;
    y: number;
  };
  timestamp: string;
}

/**
 * Response containing tile layout information
 */
export interface TileLayoutResponse {
  userId: string;
  order: TileType[];
  visibility: Record<TileType, boolean>;
  lastModified: string;
  success: boolean;
}

/**
 * Request to update tile layout
 */
export interface TileLayoutRequest {
  order?: TileType[];
  visibility?: Record<TileType, boolean>;
}

/**
 * Visibility settings for tiles
 */
export interface TileVisibility {
  tileId: string;
  visible: boolean;
}

/**
 * Response for a tile operation
 */
export interface TileResponse {
  success: boolean;
  message?: string;
  tileId?: string;
}

/**
 * Memory data for memory tile
 */
export interface MemoryData {
  total: number;
  used: number;
  free: number;
  timestamp: string;
  unit: 'MB' | 'GB';
  processes?: Array<{ name: string; memory: number }>;
}