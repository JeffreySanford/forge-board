import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TileStateService } from './tile-state.service';

// Import from shared library but don't redefine them locally
import { TileLayoutResponse, TileType } from '@forge-board/shared/api-interfaces';

@Controller('tiles')
export class TileStateController {
  constructor(private readonly tileStateService: TileStateService) {}

  @Get(':userId/order')
  getTileOrder(@Param('userId') userId: string): TileLayoutResponse {
    return this.tileStateService.getTileOrder(userId);
  }

  @Post(':userId/order')
  setTileOrder(
    @Param('userId') userId: string,
    @Body() body: { order: TileType[] }
  ): TileLayoutResponse {
    return this.tileStateService.setTileOrder(userId, body.order);
  }

  @Post(':userId/visibility')
  setTileVisibility(
    @Param('userId') userId: string,
    @Body() body: { visibility: Record<TileType, boolean> }
  ): TileLayoutResponse {
    return this.tileStateService.setTileVisibility(userId, body.visibility);
  }
}
