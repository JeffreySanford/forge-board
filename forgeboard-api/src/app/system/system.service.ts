import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  cpus: os.CpuInfo[];
  memory: {
    total: number;
    free: number;
    used: number;
    percentUsed: number;
  };
  uptime: number;
  network: Record<string, os.NetworkInterfaceInfo[]>;
}

export interface HashResult {
  algorithm: string;
  hash: string;
  timestamp: string;
}

export interface PathResult {
  original: string | string[];
  result: string;
  timestamp: string;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  /**
   * Get system information
   */
  getSystemInfo(): SystemInfo {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus(),
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        percentUsed: ((totalMemory - freeMemory) / totalMemory) * 100,
      },
      uptime: os.uptime(),
      network: os.networkInterfaces(),
    };
  }

  /**
   * Get system performance metrics
   */
  getPerformanceMetrics() {
    const loadAvg = os.loadavg();
    return {
      timestamp: new Date().toISOString(),
      cpuUsage: {
        loadAverage1min: loadAvg[0],
        loadAverage5min: loadAvg[1], 
        loadAverage15min: loadAvg[2],
      },
      memoryUsage: {
        total: os.totalmem(),
        free: os.freemem(),
        percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      processMemory: process.memoryUsage(),
    };
  }

  /**
   * Generate hash for data using specified algorithm
   */
  generateHash(data: string, algorithm = 'sha256'): HashResult {
    this.logger.debug(`Generating ${algorithm} hash for data`);
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    
    return {
      algorithm,
      hash: hash.digest('hex'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize a path
   */
  normalizePath(pathString: string): PathResult {
    this.logger.debug(`Normalizing path: ${pathString}`);
    return {
      original: pathString,
      result: path.normalize(pathString),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Join multiple path segments
   */
  joinPaths(paths: string[]): PathResult {
    this.logger.debug(`Joining paths: ${paths.join(', ')}`);
    return {
      original: paths,
      result: path.join(...paths),
      timestamp: new Date().toISOString()
    };
  }
}
