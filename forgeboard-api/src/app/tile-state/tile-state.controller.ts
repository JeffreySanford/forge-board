import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TileStateService } from './tile-state.service';

@Controller('tile-state')
export class TileStateController {
  constructor(private readonly tileStateService: TileStateService) {}

  @Get()
  getTileOrder(@Query('userId') userId: string) {
    return { order: this.tileStateService.getTileOrder(userId) };
  }

  @Post()
  setTileOrder(@Query('userId') userId: string, @Body() body: { order: string[] }) {
    this.tileStateService.setTileOrder(userId, body.order);
    return { success: true };
  }
}
