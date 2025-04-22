import { 
  TileType,
  Tile, 
  TileDragEvent as SharedTileDragEvent,
  TileLayoutResponse
} from '@forge-board/shared/api-interfaces';

// Re-export the types from the shared library
export { TileType, Tile, TileLayoutResponse };

// Extended tile interface with additional frontend-specific properties
export interface ExtendedTile extends Tile {
  selected?: boolean;
  expanded?: boolean;
  customConfig?: Record<string, any>;
}

// Re-export the TileDragEvent interface
export type TileDragEvent = SharedTileDragEvent;

// Additional frontend-specific types
export interface TileStyle {
  color?: string;
  border?: string;
  background?: string;
}

export interface TileConfig {
  refreshInterval?: number;
  animation?: boolean;
  style?: TileStyle;
}
