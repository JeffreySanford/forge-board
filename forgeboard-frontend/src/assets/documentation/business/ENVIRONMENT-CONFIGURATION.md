# <img src="../images/logo.png" alt="ForgeBoard Logo" width="32" height="32" style="vertical-align: middle; margin-right: 8px;"> ForgeBoard: Environment Configuration

<div style="background: linear-gradient(90deg, #002868 0%, #BF0A30 100%); height: 8px; margin-bottom: 20px;"></div>

*A product of True North Insights, a division of True North*

*Last Updated: May 15, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Category:</strong> Technical Reference
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> Production Ready
  </div>
  <div style="background-color: #2196F3; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Scope:</strong> Development & Production
  </div>
</div>

## Overview

ForgeBoard uses environment variables for configuration, allowing flexible deployment across different environments. This document outlines the key environment variables used by the application, with a focus on database configuration.

## Environment Files

ForgeBoard uses a `.env` file for environment variables. In a production deployment, these would typically be provided by the hosting environment.

Example `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/forgeboard
USE_IN_MEMORY_MONGO=true
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_CONSOLE_LOGS=true
```

## Key Environment Variables

### Database Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/forgeboard` | `mongodb://user:password@host:port/database` |
| `USE_IN_MEMORY_MONGO` | Use in-memory MongoDB (for development) | `false` | `true` |

### Server Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | HTTP port for the API server | `3000` | `8080` |
| `NODE_ENV` | Node.js environment | `development` | `production` |

### Logging Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Minimum log level to display | `info` | `debug`, `info`, `warn`, `error` |
| `ENABLE_CONSOLE_LOGS` | Enable console logging | `true` in development | `false` |

## TypeScript Environment Interface

ForgeBoard uses TypeScript interfaces to type-check environment variables:

```typescript
export interface Environment {
  production: boolean;
  apiUrl: string;
  socketUrl: string;
  apiBaseUrl: string;
  socketBaseUrl: string;
  // ... other properties
  
  mongo?: {
    uri: string;
    options: Record<string, any>;
  };
  
  useInMemoryMongo: boolean;
  mongoUri: string;
  logsPath: string;
}
```

## Environment-Specific Configuration

ForgeBoard includes environment-specific configuration files:

### Development Environment

The development environment uses in-memory MongoDB by default:

```typescript
// environment.ts
export const environment = {
  production: false,
  // ... other properties
  mongo: {
    uri: 'mongodb://localhost:27017/forgeboard',
    options: {}
  },
  useInMemoryMongo: true,
  mongoUri: 'In-Memory MongoDB',
  logsPath: 'logs'
};
```

### Production Environment

The production environment uses persistent MongoDB:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  // ... other properties
  mongo: { 
    uri: '', // From server-side config
    options: {}
  },
  useInMemoryMongo: false,
  mongoUri: 'Production MongoDB',
  logsPath: 'logs'
};
```

## In-Memory MongoDB Configuration

When `USE_IN_MEMORY_MONGO=true`, the application:

1. Creates a new instance of MongoDB Memory Server
2. Logs the connection URI to the console
3. Configures all services to use this instance

This provides several benefits:
- No need for a separate MongoDB installation during development
- Fresh database on each application start
- Isolated testing environment
- No data persistence (useful for demos and development)

## MongoDB Seed Data

For development convenience, ForgeBoard includes seed data services that populate the database with initial data. The seed service is defined in:

- `forgeboard-api/src/app/seed.service.ts`

To use seed data in your own development:

1. Set `USE_IN_MEMORY_MONGO=true` in your `.env` file
2. Start the application
3. The seed service will automatically populate the database

## See Also

- [DATABASE.md](DATABASE.md) - Detailed MongoDB configuration documentation
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - API documentation with database architecture

---

<div style="background-color: #F5F5F5; padding: 15px; border-radius: 6px; margin-top: 30px; border-top: 3px solid #BF0A30;">
  <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
    <div>
      <strong>ForgeBoard</strong><br>
      A product of True North Insights<br>
      &copy; 2025 True North. All rights reserved.
    </div>
    <div>
      <strong>Contact:</strong><br>
      <a href="mailto:support@truenorthinsights.com">support@truenorthinsights.com</a><br>
      <a href="https://www.truenorthinsights.com">www.truenorthinsights.com</a>
    </div>
  </div>
</div>
