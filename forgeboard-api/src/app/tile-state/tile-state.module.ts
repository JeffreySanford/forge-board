import { Module } from '@nestjs/common';
import { TileStateController } from './tile-state.controller';
import { TileStateService } from './tile-state.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TileState, TileStateSchema } from '../models/tile-state.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TileState.name, schema: TileStateSchema },
    ]),
  ],
  controllers: [TileStateController],
  providers: [TileStateService],
  exports: [TileStateService],
})
export class TileStateModule {}
