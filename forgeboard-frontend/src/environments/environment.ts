// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  socketBaseUrl: 'http://localhost:3000',
  useInMemoryMongo: true,
  mongoUri: 'mongodb://localhost:27017/forgeboard',
  logsPath: 'assets/logs',
  version: '1.0.0',
  build: 'development',
  // Adding apiUrl as an alias for apiBaseUrl to fix references
  get apiUrl() { return this.apiBaseUrl; },
  get socketUrl() { return this.socketBaseUrl; },
  // Adding a default guest token for development
  jwtGuestToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdC11c2VyIiwibmFtZSI6Ikd1ZXN0IFVzZXIiLCJyb2xlIjoiZ3Vlc3QiLCJpYXQiOjE2ODgzNDQ3MDN9.yVTwauCTno3n1d-ci3zSIr0vltWGqmvholpKFMFsyhw',
  // Feature flags
  features: {
    enableMockData: true,
    enableDiagnostics: true,
    enableSocketLogging: true,
    enableTypeValidation: true
  },
  // Logging configuration
  logging: {
    level: 'debug',
    enableConsole: true
  }
};
// Real keys and secrets are now in .env and should be loaded at runtime.
