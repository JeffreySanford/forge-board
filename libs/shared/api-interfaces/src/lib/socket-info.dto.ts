/**
 * Data Transfer Object for Socket information.
 * Used for API responses.
 */
export class SocketInfoDto<TData = unknown> {
  id = '';

  namespace = 'default';

  clientIp = '';

  userAgent = '';

  connectTime: string | Date = new Date();

  disconnectTime?: string | Date;

  lastActivity: string | Date = new Date();
  
  events: DiagnosticSocketEventDto<TData>[] = [];

  connected?: string | Date;

  status?: string;

  constructor(partial?: Partial<SocketInfoDto<TData>>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * DTO for socket events
 */
export class DiagnosticSocketEventDto<TData = unknown> {
  type = '';
  timestamp: string | Date = new Date();

  data?: TData;

  constructor(partial?: Partial<DiagnosticSocketEventDto<TData>>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
