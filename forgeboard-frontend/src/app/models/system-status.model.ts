/**
 * Represents the system status information
 */
export interface SystemStatus {
  status: string;
  uptime: number;
  memory?: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  services?: string[];
  controllers?: string[];
  gateways?: string[];
  errors?: string[];
  socketStatus?: string;
  lastChecked?: Date;
}
