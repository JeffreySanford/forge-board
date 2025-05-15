/**
 * Determine if console logging should be enabled based on environment
 */
export function shouldEnableConsoleLogging(): boolean {
  // In production, disable verbose console output
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // In development, check for DEBUG env var
  if (process.env.NODE_ENV === 'development') {
    return process.env.DEBUG_CONSOLE === 'true';
  }
  
  // Default to minimal logging
  return false;
}
