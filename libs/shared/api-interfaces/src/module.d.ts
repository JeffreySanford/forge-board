/**
 * Module declaration to help with module resolution
 * This helps prevent the "Cannot find module '@forge-board/shared/api-interfaces'" error
 */

declare module '@forge-board/shared/api-interfaces' {
  export * from './index';
}

/**
 * Ensure the library's types are properly exposed to Angular
 * This helps with the module resolution in the Angular application
 */
declare module '@forge-board/api-interfaces' {
  export * from './index';
}
