/**
 * Available tile types
 */
export type TileType = 'metrics' | 'connection' | 'logs' | 'uptime' | 'activity';

/**
 * Tile interface for dashboard components
 */
export interface Tile {
  id: string;
  type: TileType;
  title: string;
  order: number;
  visible: boolean;
  data?: Record<string, unknown>;
}

/**
 * Tile layout response from API
 */
export interface TileLayoutResponse {
  userId: string;
  order: TileType[];
  visibility: Record<TileType, boolean>;
  lastModified: string;
  success?: boolean;  // Adding optional success property
}

/**
 * Drag event for tile reordering
 */
export interface TileDragEvent {
  previousIndex: number;
  currentIndex: number;
}
