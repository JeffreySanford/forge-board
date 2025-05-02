import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthGateway } from './auth.gateway';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WsJwtGuard } from './ws-jwt.guard';
import { SocketModule } from '../socket/socket.module';
import { JwtService } from '@nestjs/jwt';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';

@Module({
  imports: [
    UserModule,
    SocketModule,
    ConfigModule,
    forwardRef(() => DiagnosticsModule)
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    AuthGateway, 
    JwtAuthGuard, 
    WsJwtGuard,
    JwtService,
  ],
  exports: [AuthService, JwtAuthGuard, WsJwtGuard, JwtService],
})
export class AuthModule {}
