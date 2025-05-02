export interface Health {
    status: 'up' | 'down' | 'degraded';
    timestamp: string;
    version?: string;
    uptime?: number;
    message?: string;
    details?: Record<string, HealthDetail>;
}

export interface HealthData {
    status: 'up' | 'down' | 'degraded' | 'unknown' | 'simulated' | 'healthy' | 'unhealthy';
    timestamp: string;
    version?: string;
    uptime?: number;
    message?: string;
    details?: Record<string, HealthDetail>;
}  

export interface HealthDetail {
    status?: 'up' | 'down' | 'degraded';
    message?: string;
    [key: string]: string | undefined | 'up' | 'down' | 'degraded';
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  timestamp: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
