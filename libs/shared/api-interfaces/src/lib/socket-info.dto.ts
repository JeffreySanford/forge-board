import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for Socket information.
 * Used for API responses and Swagger documentation.
 */
export class SocketInfoDto<TData = unknown> {
  @ApiProperty({ description: 'Socket ID' })
  id = '';

  @ApiProperty({ description: 'Namespace of the socket' })
  namespace = 'default';

  @ApiProperty({ description: 'Client IP address' })
  clientIp = '';

  @ApiProperty({ description: 'User agent of the client' })
  userAgent = '';

  @ApiProperty({ description: 'Connection timestamp' })
  connectTime: string | Date = new Date();

  @ApiPropertyOptional({ description: 'Disconnection timestamp' })
  disconnectTime?: string | Date;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: string | Date = new Date();
  
  @ApiProperty({
    description: 'Events associated with the socket',
    type: () => [DiagnosticSocketEventDto],
  })
  events: DiagnosticSocketEventDto<TData>[] = [];

  @ApiPropertyOptional({
    description: 'Connected timestamp (for compatibility)',
  })
  connected?: string | Date;

  @ApiPropertyOptional({ description: 'Status of the socket' })
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
  @ApiProperty({ description: 'Event type' })
  type = '';
  @ApiProperty({ description: 'Event timestamp' })
  timestamp: string | Date = new Date();

  @ApiPropertyOptional({ description: 'Event data' })
  data?: TData;

  constructor(partial?: Partial<DiagnosticSocketEventDto<TData>>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
