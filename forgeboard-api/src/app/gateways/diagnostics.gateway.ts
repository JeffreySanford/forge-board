import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { Health } from '../diagnostics/diagnostics.controller';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';

interface DiagnosticEvent {
  event: string;
  timestamp: string;
  id: string;
}

@WebSocketGateway({ path: '/socket.io' })
export class DiagnosticsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private diagnosticsService: DiagnosticsService) {}

  afterInit() {
    // Optionally, emit health on interval or on demand
    setInterval(() => {
      const health: Health = this.diagnosticsService.getHealth();
      this.emitHealthUpdate(health);
    }, 5000);
  }

  emitDiagnosticEvent(eventData: DiagnosticEvent): void {
    const response = createSocketResponse('diagnostics-event', eventData);
    this.server.emit('diagnostics-event', response);
  }

  emitHealthUpdate(health: Health): void {
    const response = createSocketResponse('healthUpdate', health);
    this.server.emit('healthUpdate', response);
  }
}
