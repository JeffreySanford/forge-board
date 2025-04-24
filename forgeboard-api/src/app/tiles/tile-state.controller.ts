import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { TileStateService } from './tile-state.service';
import { TileType } from '@forge-board/shared/api-interfaces';

@Controller('tiles')
export class TileStateController {
  private readonly logger = new Logger(TileStateController.name);
  
  constructor(private readonly tileStateService: TileStateService) {}
  
  @Get(':userId/order')
  getTileOrder(@Param('userId') userId: string) {
    this.logger.log(`GET /tiles/${userId}/order`);
    return this.tileStateService.getTileOrder(userId);
  }
  
  @Post(':userId/order')
  setTileOrder(
    @Param('userId') userId: string, 
    @Body() body: { order: TileType[] }
  ) {
    this.logger.log(`POST /tiles/${userId}/order`);
    return this.tileStateService.setTileOrder(userId, body.order);
  }
  
  @Post(':userId/visibility')
  setTileVisibility(
    @Param('userId') userId: string, 
    @Body() body: { visibility: Record<TileType, boolean> }
  ) {
    this.logger.log(`POST /tiles/${userId}/visibility`);
    return this.tileStateService.setTileVisibility(userId, body.visibility);
  }
}
