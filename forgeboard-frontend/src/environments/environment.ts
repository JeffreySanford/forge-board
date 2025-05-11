export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  apiBaseUrl: 'http://localhost:3000/api',
  socketBaseUrl: 'http://localhost:3000',
  encryptedJwtToken: '', // Set at runtime after user login
  jwtGuestToken: '', // Loaded from environment variable or runtime config
  features: {
    enableMockData: true,
    enableDiagnostics: true,
    enableSocketLogging: true,
    enableTypeValidation: true
  },
  logging: {
    level: 'debug',
    enableConsole: true
  },
  mongo: {
    uri: '', // Loaded from environment variable or runtime config
    options: {
      // Removed deprecated options that are no longer needed in MongoDB driver v4.0+
    }
  },
  useInMemoryMongo: true,
  mongoUri: 'In-memory MongoDB',
  logsPath: 'logs' // Custom path for logs endpoint (default is 'logs')
};
// Real keys and secrets are now in .env and should be loaded at runtime.
