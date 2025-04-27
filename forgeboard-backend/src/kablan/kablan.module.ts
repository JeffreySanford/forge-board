import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KablanController } from './kablan.controller';
import { KablanService } from './kablan.service';
import { KablanGateway } from './kablan.gateway';
import { KablanBoard, KablanBoardSchema } from './schemas/kablan-board.schema';
import { SocketRegistryModule } from '../app/socket-registry/socket-registry.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KablanBoard.name, schema: KablanBoardSchema },
    ]),
    SocketRegistryModule,
  ],
  controllers: [KablanController],
  providers: [KablanService, KablanGateway],
  exports: [KablanService],
})
export class KablanModule {}
