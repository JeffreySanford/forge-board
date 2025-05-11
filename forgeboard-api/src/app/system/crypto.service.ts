import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface HashResult {
  algorithm: string;
  hash: string;
  timestamp: string;
}

export interface RandomBytesResult {
  size: number;
  bytes: string;
  encoding: string;
  timestamp: string;
}

/**
 * Service for cryptographic operations
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  /**
   * Generate a hash for data using specified algorithm
   */
  createHash(data: string, algorithm = 'sha256', encoding: 'hex' | 'base64' = 'hex'): HashResult {
    this.logger.debug(`Creating ${algorithm} hash with ${encoding} encoding`);
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    
    return {
      algorithm,
      hash: hash.digest(encoding),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate random bytes
   */
  generateRandomBytes(size: number, encoding: 'hex' | 'base64' = 'hex'): RandomBytesResult {
    this.logger.debug(`Generating ${size} random bytes with ${encoding} encoding`);
    const bytes = crypto.randomBytes(size);
    
    return {
      size,
      bytes: bytes.toString(encoding),
      encoding,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Hash a password with salt
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    // Generate salt if not provided
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    
    // Hash password with salt
    const hash = crypto.pbkdf2Sync(password, useSalt, 1000, 64, 'sha512').toString('hex');
    
    return { hash, salt: useSalt };
  }

  /**
   * Verify a password against a hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const generatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return generatedHash === hash;
  }
}
