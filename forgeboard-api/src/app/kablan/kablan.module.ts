import { Module } from '@nestjs/common';
import { KablanController } from './kablan.controller';
import { KablanService } from './kablan.service';
import { KablanSocketGateway } from './kablan-socket.gateway';

@Module({
  controllers: [KablanController],
  providers: [KablanService, KablanSocketGateway],
  exports: [KablanService],
})
export class KablanModule {}
