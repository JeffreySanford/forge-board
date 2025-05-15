export const environment = {
  production: true,
  apiUrl: '/api',
  socketUrl: '',
  apiBaseUrl: '/api', // Use relative path in production
  socketBaseUrl: '',   // Use relative path in production
  encryptedJwtToken: '', // Should be managed by AuthService, but defined for interface compliance
  jwtGuestToken: '',   // Provide a production guest token if applicable, or leave empty
  features: {
    enableMockData: false,
    enableDiagnostics: false,
    enableSocketLogging: false,
    enableTypeValidation: false
  },
  logging: {
    level: 'info', // Production log level
    enableConsole: false // Disable console logging in production
  },
  mongo: { // Optional, so can be undefined or minimal
    uri: '', // Production MongoDB URI (likely from server-side config)
    options: {}
  },
  useInMemoryMongo: false,
  mongoUri: 'Production MongoDB', // Placeholder or actual connection info
  logsPath: 'logs'
};
// Real keys and secrets are now in .env and should be loaded at runtime.
