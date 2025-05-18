/**
 * Socket services barrel file
 * 
 * This file exports all socket-related services for easy imports
 * throughout the application.
 */

// Export core socket interfaces
export * from './socket-client.service';

// Export modern socket client
export * from './modern-socket-client.service';

// Export browser-specific implementation
export * from './browser-socket-client.service';

// Export factory service
export * from './socket-client-factory.service';

// Export additional socket services
export * from './browser-socket.service';
export * from './socket.service';
export * from './socket-registry.service';
