# ForgeBoard API Documentation

## Overview

ForgeBoard uses a REST API for data operations and WebSockets for real-time metrics. This document outlines the available endpoints, expected responses, and error handling.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Authentication endpoints manage user sessions.

### GET /api/auth/status

Check authentication status.

**Response:**
```json
{
  "status": "authenticated",
  "user": {
    "username": "jeffrey.sanford",
    "role": "admin"
  }
}
```

## Metrics

Metrics endpoints provide system performance data.

### GET /api/metrics/stream

Get current system metrics.

**Response:**
```json
{
  "cpu": 45.2,
  "memory": 68.7,
  "time": "2023-07-15T12:34:56Z"
}
```

### GET /api/metrics/set-interval?interval={ms}

Set the polling interval for metrics.

**Parameters:**
- `interval`: Polling interval in milliseconds

**Response:**
```json
{
  "success": true,
  "interval": 1000
}
```

### POST /api/metrics/register

Register metrics data point.

**Request Body:**
```json
{
  "cpu": 45.2,
  "memory": 68.7,
  "time": "2023-07-15T12:34:56Z"
}
```

**Response:**
```json
{
  "success": true
}
```

## Users

User management endpoints.

### GET /api/users/status

Get user service status.

**Response:**
```json
{
  "status": "online",
  "version": "1.0.0"
}
```

## WebSockets

Real-time communication.

### Socket: /api/socket-health

WebSocket health check endpoint.

**Emitted Events:**
- `health`: Regular health pulse with timestamp

## Error Handling

### Error Responses

All API endpoints use standard HTTP status codes:

- **200 OK**: Successful request
- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "status": "error",
  "code": 404,
  "message": "Resource not found",
  "path": "/api/unknown",
  "timestamp": "2023-07-15T12:34:56Z"
}
```

## Service Health Endpoints

These endpoints are used by the error page to check system status.

### GET /api/auth/status
Authentication service health check.

### GET /api/metrics/status
Metrics service health check.

### GET /api/users/status
User service health check.

### GET /api/socket-health
WebSocket connection health check.

Each health endpoint returns a simple status response:

```json
{
  "status": "online",
  "timestamp": "2023-07-15T12:34:56Z"
}
```

## Status Endpoints

### GET /api/status

Check API availability and health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-07-15T12:34:56Z",
  "version": "1.0.0"
}
```

## Frontend Error Handling & Auto-Reconnection

### Real-time Data Fallback System

ForgeBoard implements a sophisticated fallback and auto-reconnection system:

1. **Connectivity Monitoring**: Constantly monitors backend service availability
2. **Graceful Degradation**: Seamlessly switches to mock data generation when backend becomes unavailable
3. **Visual Indication**: Displays connection status indicator showing when mock data is in use
4. **Periodic Health Checks**: Regularly checks if backend has become available again
5. **Auto-Reconnection**: Automatically reconnects and switches back to live data when backend is restored
6. **Manual Override**: Provides button to force reconnection attempt when using mock data

### Reconnection Flow

The reconnection system follows this workflow:

1. When a service loses connection to the backend, it:
   - Activates mock data generation for uninterrupted UI updates
   - Updates connection status via the BackendStatusService
   - Shows visual indicator that mock data is being used

2. While using mock data:
   - Backend health is checked every 5 seconds
   - Connection status indicator displays "Using Mock Data"
   - Expanded connection panel shows which services are using mock data

3. When backend becomes available:
   - BackendStatusService detects available backend and dispatches 'backend-available' event
   - Each service receives the event and initiates reconnection sequence
   - Services verify backend availability with direct health check
   - New socket connections are established
   - Mock data generation is stopped when real data starts flowing
   - Connection status updates to reflect live connection

4. Manual reconnection:
   - User can click connection status indicator to expand details
   - "Try Reconnect" button forces immediate reconnection attempt
   - Visual feedback provided during reconnection process

This approach ensures the application remains usable even during backend outages and provides a seamless transition back to real-time data when services are restored.
