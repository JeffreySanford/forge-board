import { HealthData, HealthStatus } from '@forge-board/shared/api-interfaces';

/**
 * Extended health data type with additional frontend-specific properties
 */
export interface EnhancedHealthData extends HealthData {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  details?: Record<string, unknown>;
  components?: Array<Record<string, unknown>>;
  clientProcessedTimestamp?: string;
  isSimulated?: boolean;
}
