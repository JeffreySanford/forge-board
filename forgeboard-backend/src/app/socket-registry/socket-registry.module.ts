import { Module } from '@nestjs/common';
import { SocketRegistryService } from '../services/socket-registry.service';

@Module({
  providers: [SocketRegistryService],
  exports: [SocketRegistryService],
})
export class SocketRegistryModule {}
