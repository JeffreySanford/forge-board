import { Injectable } from '@nestjs/common';
import * as path from 'path';

/**
 * Service for path operations
 * This service provides methods corresponding to Node.js path module
 */
@Injectable()
export class PathService {
  /**
   * Join path segments
   */
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Resolve path to absolute path
   */
  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Get the last portion of a path
   */
  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get the directory name of a path
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get the extension of a path
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Normalize a path
   */
  normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Check if the path is absolute
   */
  isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Get the relative path from one path to another
   */
  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Parse a path into an object
   */
  parse(filePath: string): path.ParsedPath {
    return path.parse(filePath);
  }
}
