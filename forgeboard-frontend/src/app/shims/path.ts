/**
 * Minimal browser-compatible implementation of Node's path module
 */

console.log('[Shim] Path module loaded');

/**
 * Platform-specific path separator
 */
export const sep = '/';

/**
 * Platform-specific path delimiter
 */
export const delimiter = ':';

/**
 * Path object format options
 */
interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

/**
 * Returns the directory name of a path
 */
export function dirname(path: string): string {
  console.log(`[Shim] path.dirname called with: ${path}`);
  if (!path) return '.';
  
  // Handle trailing slashes
  let end = path.length;
  while (end > 0 && path[end - 1] === sep) {
    end--;
  }
  if (end === 0) return sep;
  
  const lastSlash = path.lastIndexOf(sep, end - 1);
  if (lastSlash === -1) return '.';
  if (lastSlash === 0) return sep;
  
  return path.slice(0, lastSlash);
}

/**
 * Returns the last portion of a path
 */
export function basename(path: string, ext?: string): string {
  console.log(`[Shim] path.basename called with: ${path}, ext: ${ext || 'none'}`);
  if (!path) return '';
  
  // Handle trailing slashes
  let end = path.length;
  while (end > 0 && path[end - 1] === sep) {
    end--;
  }
  if (end === 0) return '';
  
  const lastSlash = path.lastIndexOf(sep, end - 1);
  const filename = lastSlash === -1 ? path.slice(0, end) : path.slice(lastSlash + 1, end);
  
  if (ext && filename.endsWith(ext)) {
    return filename.slice(0, filename.length - ext.length);
  }
  
  return filename;
}

/**
 * Returns the extension of the path
 */
export function extname(path: string): string {
  console.log(`[Shim] path.extname called with: ${path}`);
  if (!path) return '';
  
  // Find the last occurrence of '.'
  const lastDot = path.lastIndexOf('.');
  if (lastDot < 0) return '';
  
  // Check if this is just a dotfile without extension
  const lastSlash = path.lastIndexOf(sep);
  if (lastSlash > lastDot) return '';
  if (lastDot === 0 || lastDot === path.length - 1) return '';
  
  return path.slice(lastDot);
}

/**
 * Join all arguments together and normalize the resulting path
 */
export function join(...paths: string[]): string {
  console.log(`[Shim] path.join called with: ${paths.join(', ')}`);
  if (paths.length === 0) return '.';
  
  let joined = '';
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (path.length > 0) {
      if (joined.length > 0) {
        joined += sep;
      }
      joined += path;
    }
  }
  
  return normalize(joined);
}

/**
 * Normalize a path, resolving '..' and '.' segments
 */
export function normalize(path: string): string {
  console.log(`[Shim] path.normalize called with: ${path}`);
  if (!path) return '.';
  
  // Replace backslashes with forward slashes for Windows compatibility
  path = path.replace(/\\/g, '/');
  
  // Handle empty path
  if (path === '') return '.';
  
  const isAbsolute = path[0] === sep;
  const trailingSep = path[path.length - 1] === sep;
  
  // Split the path into segments
  const segments = path.split(sep).filter(Boolean);
  const stack: string[] = [];
  
  // Process each segment
  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') {
        stack.pop();
      } else if (!isAbsolute) {
        stack.push('..');
      }
    } else {
      stack.push(segment);
    }
  }
  
  // Join the segments back together
  let result = stack.join(sep);
  
  // Handle special cases
  if (result === '') {
    result = isAbsolute ? sep : '.';
  } else if (isAbsolute) {
    result = sep + result;
  }
  
  // Add trailing separator if necessary
  if (trailingSep && result[result.length - 1] !== sep) {
    result += sep;
  }
  
  return result;
}

/**
 * Resolve a sequence of paths to an absolute path
 */
export function resolve(...paths: string[]): string {
  console.log(`[Shim] path.resolve called with: ${paths.join(', ')}`);
  
  let resolvedPath = '';
  let resolvedAbsolute = false;
  
  for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? paths[i] : process.cwd();
    
    // Skip empty paths
    if (!path) continue;
    
    resolvedPath = path + sep + resolvedPath;
    resolvedAbsolute = path[0] === sep;
  }
  
  // Remove trailing separator
  resolvedPath = normalize(resolvedPath);
  
  return resolvedAbsolute ? resolvedPath : sep + resolvedPath;
}

/**
 * Returns an object with path components
 */
export function parse(path: string): ParsedPath {
  console.log(`[Shim] path.parse called with: ${path}`);
  
  const dir = dirname(path);
  const base = basename(path);
  const ext = extname(base);
  const name = base.slice(0, base.length - ext.length);
  const root = path.startsWith(sep) ? sep : '';
  
  return { root, dir, base, ext, name };
}

/**
 * Generates a path string from an object
 */
export function format(pathObject: Partial<ParsedPath>): string {
  console.log('[Shim] path.format called');
  
  if (!pathObject) return '';
  
  const { root = '', dir = '', base = '', ext = '', name = '' } = pathObject;
  
  let path = '';
  
  if (dir) {
    path = dir;
  } else if (root) {
    path = root;
  }
  
  if (base) {
    if (path && path[path.length - 1] !== sep) {
      path += sep;
    }
    path += base;
  } else if (name) {
    if (path && path[path.length - 1] !== sep) {
      path += sep;
    }
    path += name;
    if (ext && !ext.startsWith('.')) {
      path += '.' + ext;
    } else {
      path += ext;
    }
  }
  
  return path;
}

/**
 * Check if the path is absolute
 */
export function isAbsolute(path: string): boolean {
  console.log(`[Shim] path.isAbsolute called with: ${path}`);
  if (!path) return false;
  return path.startsWith(sep);
}

/**
 * Return the relative path from 'from' to 'to'
 */
export function relative(from: string, to: string): string {
  console.log(`[Shim] path.relative called with from: ${from}, to: ${to}`);
  
  from = resolve(from);
  to = resolve(to);
  
  const fromParts = from.split(sep).filter(Boolean);
  const toParts = to.split(sep).filter(Boolean);
  
  let commonLength = 0;
  const length = Math.min(fromParts.length, toParts.length);
  
  while (commonLength < length && fromParts[commonLength] === toParts[commonLength]) {
    commonLength++;
  }
  
  const upParts = fromParts.slice(commonLength).map(() => '..');
  const downParts = toParts.slice(commonLength);
  
  return [...upParts, ...downParts].join(sep) || '.';
}

// Polyfill for process.cwd() which doesn't exist in browsers
if (typeof process === 'undefined' || !process.cwd) {
  (window as any).process = (window as any).process || {};
  (window as any).process.cwd = () => '/';
}

// Add a method to check if the shim is being used
export function isShimActive(): boolean {
  console.log('[Shim] Path shim usage detected');
  return true;
}
