# <img src="../images/logo.png" alt="ForgeBoard Logo" width="32" height="32" style="vertical-align: middle; margin-right: 8px;"> ForgeBoard: Database Configuration

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
    <strong>Type:</strong> MongoDB + Mongoose
  </div>
</div>

## Overview

ForgeBoard uses MongoDB as its primary database, with Mongoose providing schema validation and ODM (Object Document Mapper) capabilities. The database configuration is designed to be flexible, supporting both development with in-memory databases and production deployments with persistent storage.

## Configuration Options

ForgeBoard can be configured to use either:

1. **In-Memory MongoDB** - For development, testing, and CI environments
2. **Persistent MongoDB** - For production and staging environments

This configuration is controlled via environment variables.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/forgeboard` |
| `USE_IN_MEMORY_MONGO` | If set to `true`, uses in-memory MongoDB | `false` |

## In-Memory MongoDB

When `USE_IN_MEMORY_MONGO` is set to `true`, ForgeBoard will:

1. Create a new instance of MongoDB Memory Server at application startup
2. Log the connection URI to the console with the message: `[MongoMemoryServer] Started in-memory MongoDB at <uri>`
3. Use this database for all operations during the application lifecycle
4. Automatically clean up the database when the application shuts down

This is particularly useful for:
- Local development without an external MongoDB installation
- CI/CD pipelines
- Testing environments
- Demonstrations and training

### Benefits of In-Memory MongoDB

- No external database installation required
- Data is reset on application restart (clean slate)
- Fast performance for development tasks
- Isolated database for each application instance

## Persistent MongoDB

For production deployments, ForgeBoard connects to a standard MongoDB instance using the URI specified in the `MONGODB_URI` environment variable.

### Connection Configuration

The connection is configured in `forgeboard-api/src/app/app.module.ts` using NestJS's `MongooseModule.forRootAsync()`. This ensures that the database connection is established before the application starts handling requests.

## Data Models

ForgeBoard uses the following Mongoose schemas:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | User accounts and authentication | username, email, password (hashed), roles |
| Log | System and user activity logs | level, message, timestamp, metadata |
| Metric | System performance metrics | name, value, timestamp, source |
| Diagnostic | System health diagnostics | type, status, details, timestamp |
| KanbanBoard | Project management boards | title, columns, cards, lastModified |
| Sound | Audio system resources | category, filename, path, required |

## Database Administration

### Accessing the Database

For development with in-memory MongoDB:
- The database is accessible only through the application
- The connection URI is logged to the console during startup

For production MongoDB:
- Use standard MongoDB tools for administration (MongoDB Compass, mongo shell, etc.)
- Connect to the database using the URI defined in your environment

### Data Backup

For production deployments:
1. Use MongoDB's native backup tools (mongodump)
2. Set up regular backup schedules according to your organization's data retention policies
3. Consider using MongoDB Atlas managed backups for cloud deployments

## Security Considerations

ForgeBoard's MongoDB configuration includes:

- No default user credentials in configuration files
- Environment-based connection strings
- Mongoose schema validation to prevent injection attacks
- Proper error handling for database operations

## Scripts

The repository includes utility scripts for database management:

- `scripts/clear-kanban-collection.js` - Clears the kanbanboards collection
- `scripts/copy-kanban-seed-jsons.js` - Seeds the database with sample kanban boards

## Troubleshooting

Common issues and solutions:

1. **Connection Refused**
   - Check if MongoDB service is running
   - Verify the connection string in .env file
   - Ensure network connectivity to the database server

2. **Authentication Failed**
   - Verify username and password in connection string
   - Check if the user has appropriate permissions

3. **In-Memory Database Not Working**
   - Ensure `mongodb-memory-server` package is installed
   - Verify that `USE_IN_MEMORY_MONGO=true` is set in .env

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
