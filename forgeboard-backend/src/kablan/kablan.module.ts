import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KablanController } from './kablan.controller';
import { KablanGateway } from './kablan.gateway';
import { KablanService } from './kablan.service';
import { KablanBoard, KablanBoardSchema } from './schemas/kablan-board.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KablanBoard.name, schema: KablanBoardSchema }
    ])
  ],
  controllers: [KablanController],
  providers: [KablanService, KablanGateway],
  exports: [KablanService]
})
export class KablanModule {}
