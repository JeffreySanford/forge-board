/**
 * Available tile types
 */
export type TileType =
  | 'health'
  | 'memory'
  | 'metrics'
  | 'connection'
  | 'logs'
  | 'uptime'
  | 'activity'
  | 'kanban';

/**
 * Tile visibility settings
 */
export type TileVisibility = Record<TileType, boolean>;

/**
 * Tile layout response
 */
export interface TileLayoutResponse {
  userId: string;
  order: TileType[];
  visibility: Record<TileType, boolean>;
  lastModified: string;
  success: boolean;
}

/**
 * Tile layout request
 */
export interface TileLayoutRequest {
  userId: string;
  order: TileType[];
  visibility?: Record<TileType, boolean>;
}

/**
 * API response for tile operations
 */
export interface TileResponse {
  success: boolean;
  message?: string;
  data?: string;
}

/**
 * Tile configuration
 */
export interface Tile {
  id: string;
  type: TileType;
  visible: boolean;
  position: number;
  row: number; // <-- Added
  col: number; // <-- Added
}

/**
 * Event for tile drag operations
 */
export interface TileDragEvent {
  previousIndex: number;
  currentIndex: number;
  tileType: TileType;
}

/**
 * Memory data structure for system memory monitoring
 */
export interface MemoryData {
  category: string;
  usage: number;
  total: number;
  icon: string;
  details?: Record<string, unknown>;
}
