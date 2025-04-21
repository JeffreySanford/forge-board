import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  
  @WebSocketGateway()
  export class MetricsGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;
  
    afterInit() {
      setInterval(() => {
        this.server.emit('system-metrics', {
          cpu: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 100),
          time: new Date().toLocaleTimeString(),
        });
      }, 1000);
    }
  }
  