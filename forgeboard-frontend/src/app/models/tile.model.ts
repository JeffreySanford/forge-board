import {
  TileType,
  Tile,
  TileDragEvent,
  TileLayoutResponse,
} from '@forge-board/shared/api-interfaces';

// Re-export the types for convenience
export { TileType, Tile, TileDragEvent, TileLayoutResponse };

// Utility to create a tile with row/col
export function createTile(
  id: string,
  type: TileType,
  visible: boolean,
  position: number,
  row: number,
  col: number
): Tile {
  return { id, type, visible, position, row, col };
}

// Add any app-specific extensions or utilities below
// but don't redefine the imported types
