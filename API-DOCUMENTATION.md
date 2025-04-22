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

## Frontend Error Handling

The frontend application handles API errors by:

1. Displaying appropriate error messages to users
2. Redirecting to the error page with details for 500-level errors
3. Showing service status on the error page
4. Providing fallback UI when API data is unavailable
5. Implementing retry mechanisms with exponential backoff

This approach ensures the application remains usable even when backend services experience partial failures.
