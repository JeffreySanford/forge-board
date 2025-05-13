// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3333/api',
  socketBaseUrl: 'http://localhost:3333',
  useInMemoryMongo: true,
  mongoUri: 'mongodb://localhost:27017/forgeboard',
  logsPath: 'assets/logs',
  version: '1.0.0',
  build: 'development'
};
// Real keys and secrets are now in .env and should be loaded at runtime.
