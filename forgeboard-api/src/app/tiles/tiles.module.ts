import { Module } from '@nestjs/common';
import { TileStateController } from './tile-state.controller';
import { TileStateService } from './tile-state.service';

@Module({
  controllers: [TileStateController],
  providers: [TileStateService],
  exports: [TileStateService]
})
export class TilesModule {}
