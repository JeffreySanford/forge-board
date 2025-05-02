export const environment = {
  production: true,
  apiUrl: '/api',
  socketUrl: '',
  encryptedJwtToken: '', // Loaded from environment variable or runtime config
  jwtGuestToken: '', // Loaded from environment variable or runtime config
  features: {
    enableMockData: false,
    enableDiagnostics: false,
    enableSocketLogging: false,
    enableTypeValidation: true
  },
  logging: {
    level: 'error',
    enableConsole: false
  }
};
// Real keys and secrets are now in .env and should be loaded at runtime.
