import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { PathService } from './path.service';
import { PathController } from './path.controller';

@Module({
  controllers: [
    SystemController,
    CryptoController,
    PathController,
  ],
  providers: [
    SystemService,
    CryptoService,
    PathService,
  ],
  exports: [
    SystemService,
    CryptoService,
    PathService,
  ],
})
export class SystemModule {}
