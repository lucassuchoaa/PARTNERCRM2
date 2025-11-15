# 📚 API Documentation - Partners Platform

Complete API reference for serverless endpoints and external integrations.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Health & Status Endpoints](#health--status-endpoints)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [External Integrations](#external-integrations)

---

## Overview

### Base URLs

**Production**
```
https://your-domain.vercel.app/api
```

**Preview/Staging**
```
https://your-preview-deployment.vercel.app/api
```

**Local Development**
```
http://localhost:5173/api
```

### Response Format

All API responses follow a consistent format:

**Success Response**
```json
{
  "data": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Authentication

### Overview

Authentication is handled client-side using localStorage. For API endpoints requiring authentication, credentials must be validated before making requests.

### Authentication Flow

1. User submits credentials to `/login`
2. Credentials validated against user database
3. User object stored in localStorage
4. Subsequent requests include user context

### Protected Endpoints

All endpoints except `/health` and `/status` require authentication.

**Authentication Header** (if implementing JWT in future)
```
Authorization: Bearer {token}
```

---

## Health & Status Endpoints

### GET /api/health

Health check endpoint for monitoring system health and dependencies.

**Access**: Public (no authentication required)

**Request**
```bash
GET /api/health
```

**Response** (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "hubspot": {
      "status": "up",
      "responseTime": 150
    },
    "gemini": {
      "status": "up",
      "responseTime": 200
    },
    "memory": {
      "used": 45,
      "available": 55,
      "percentage": 45
    }
  }
}
```

**Response** (503 Service Unavailable)
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "hubspot": {
      "status": "down"
    }
  },
  "errors": [
    "HubSpot API unavailable"
  ]
}
```

**Status Values**
- `healthy` - All systems operational
- `degraded` - Some non-critical services down
- `unhealthy` - Critical services unavailable

**Use Cases**
- Uptime monitoring
- Load balancer health checks
- Deployment verification
- Incident investigation

---

### GET /api/status

Public status endpoint providing basic system information.

**Access**: Public (no authentication required)

**Request**
```bash
GET /api/status
```

**Response** (200 OK)
```json
{
  "status": "operational",
  "version": "1.0.0",
  "buildTime": "2024-01-15T08:00:00.000Z",
  "uptime": 7200,
  "environment": "production",
  "region": "gru1",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Values**
- `operational` - All systems working normally
- `degraded` - Partial functionality
- `down` - System unavailable

**Cache Headers**
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
```

**Use Cases**
- Public status page
- Service monitoring
- Version checking
- Regional information

---

## Rate Limiting

### Default Limits

**Public Endpoints**
- `/health`: 60 requests/minute
- `/status`: 120 requests/minute

**Authenticated Endpoints**
- General API: 100 requests/minute per user
- Write operations: 30 requests/minute per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642251600
```

### Rate Limit Exceeded

**Response** (429 Too Many Requests)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common Error Codes

**Client Errors (4xx)**
```
INVALID_REQUEST       - Malformed request
MISSING_PARAMETER     - Required parameter missing
INVALID_PARAMETER     - Parameter validation failed
UNAUTHORIZED          - Authentication required
FORBIDDEN             - Insufficient permissions
NOT_FOUND             - Resource not found
RATE_LIMIT_EXCEEDED   - Too many requests
```

**Server Errors (5xx)**
```
INTERNAL_ERROR        - Unexpected server error
SERVICE_UNAVAILABLE   - Temporary service outage
GATEWAY_TIMEOUT       - Upstream service timeout
```

### Error Examples

**Invalid Request**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request body is required",
    "details": {
      "received": "undefined"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Service Unavailable**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "HubSpot API is currently unavailable",
    "details": {
      "service": "hubspot",
      "retryAfter": 300
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## External Integrations

### HubSpot CRM Integration

**Overview**
Integration with HubSpot for contact and deal management.

**Base URL**
```
https://api.hubapi.com
```

**Authentication**
```
Authorization: Bearer {HUBSPOT_API_KEY}
```

**Supported Operations**

1. **Create Contact**
```typescript
POST /crm/v3/objects/contacts
```

2. **Create Deal**
```typescript
POST /crm/v3/objects/deals
```

3. **Get Contact**
```typescript
GET /crm/v3/objects/contacts/{contactId}
```

**Example: Create Contact**
```typescript
// Request
POST https://api.hubapi.com/crm/v3/objects/contacts
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "properties": {
    "email": "partner@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "company": "Example Corp"
  }
}

// Response
{
  "id": "12345",
  "properties": {
    "email": "partner@example.com",
    "firstname": "John",
    "lastname": "Doe"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Handling**
```typescript
try {
  const contact = await createHubSpotContact(data);
} catch (error) {
  // Log to Sentry
  captureError(error, { integration: 'hubspot' });
  // Show user-friendly message
  throw new Error('Failed to create contact in HubSpot');
}
```

**Rate Limits**
- Professional/Enterprise: 100 requests/10 seconds
- Burst: 150 requests/10 seconds

**Documentation**
https://developers.hubspot.com/docs/api/crm/contacts

---

### Gemini AI Integration

**Overview**
Google's Gemini AI for intelligent chatbot functionality.

**Base URL**
```
https://generativelanguage.googleapis.com/v1beta
```

**Authentication**
```
?key={GEMINI_API_KEY}
```

**Supported Operations**

1. **Generate Content**
```typescript
POST /models/gemini-pro:generateContent
```

**Example: Chat Message**
```typescript
// Request
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}
Content-Type: application/json

{
  "contents": [{
    "parts": [{
      "text": "How can I track my commissions?"
    }]
  }]
}

// Response
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "You can track your commissions in the Reports section..."
      }]
    }
  }]
}
```

**Error Handling**
```typescript
try {
  const response = await geminiChat(message);
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    return "Too many requests. Please try again in a moment.";
  }
  captureError(error, { integration: 'gemini' });
  return "Sorry, I'm having trouble responding right now.";
}
```

**Rate Limits**
- Free tier: 60 requests/minute
- Paid tier: Custom limits

**Documentation**
https://ai.google.dev/docs

---

### NetSuite ERP Integration (Planned)

**Overview**
Future integration with NetSuite for advanced ERP functionality.

**Status**: Planning phase

**Planned Operations**
- Invoice management
- Payment tracking
- Financial reporting
- Inventory management

**Documentation**
See [NETSUITE_INTEGRATION.md](./NETSUITE_INTEGRATION.md) for details.

---

## Analytics Endpoint (Custom)

### POST /api/analytics/web-vitals

**Purpose**: Collect Web Vitals performance metrics

**Access**: Internal only (CORS restricted)

**Request**
```typescript
POST /api/analytics/web-vitals
Content-Type: application/json

{
  "metric": "LCP",
  "value": 2341.5,
  "rating": "good",
  "id": "v3-1642251600-1234567890",
  "navigationType": "navigate",
  "timestamp": 1642251600000,
  "url": "https://your-domain.vercel.app/dashboard",
  "userAgent": "Mozilla/5.0..."
}
```

**Response** (204 No Content)
```
// No body returned
```

**Metrics Tracked**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

---

## Webhooks (Future)

### Planned Webhook Events

1. **Partner Created**
```json
{
  "event": "partner.created",
  "data": {
    "partnerId": "12345",
    "email": "partner@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

2. **Referral Submitted**
```json
{
  "event": "referral.submitted",
  "data": {
    "referralId": "67890",
    "partnerId": "12345",
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Best Practices

### Request Best Practices

1. **Always include proper headers**
```typescript
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

2. **Handle errors gracefully**
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  // Log error
  captureError(error);
  // Show user-friendly message
  showNotification('error', 'Operation failed');
}
```

3. **Implement retry logic for transient errors**
```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 500) {
        // Retry server errors
        await delay(1000 * Math.pow(2, i));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * Math.pow(2, i));
    }
  }
}
```

4. **Respect rate limits**
```typescript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 60;
  await delay(retryAfter * 1000);
  // Retry request
}
```

### Response Best Practices

1. **Always include timestamps**
2. **Use consistent error codes**
3. **Provide actionable error messages**
4. **Include correlation IDs for debugging**
5. **Set appropriate cache headers**

---

## Testing

### Health Check Test
```bash
curl -X GET https://your-domain.vercel.app/api/health
```

### Status Check Test
```bash
curl -X GET https://your-domain.vercel.app/api/status
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-domain.vercel.app/api/health

# Using Artillery
artillery quick --count 100 --num 10 https://your-domain.vercel.app/api/health
```

---

## Additional Resources

- [Deployment Guide](./DEPLOY.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Main README](./README.md)
- [HubSpot Integration](./HUBSPOT_INTEGRATION.md)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**API Version**: v1
