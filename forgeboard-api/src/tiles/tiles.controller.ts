import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TilesService } from './tiles.service';

@Controller('tiles')
export class TilesController {
  constructor(private tilesService: TilesService) {}

  @Get(':userId/order')
  getTileOrder(@Param('userId') userId: string) {
    return this.tilesService.getTileOrder(userId);
  }

  @Post(':userId/order')
  setTileOrder(@Param('userId') userId: string, @Body() data: any) {
    return this.tilesService.setTileOrder(userId, data.order);
  }

  @Post(':userId/visibility')
  setTileVisibility(@Param('userId') userId: string, @Body() data: any) {
    return this.tilesService.setTileVisibility(userId, data.visibility);
  }
}
