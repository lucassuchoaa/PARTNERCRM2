# Partners Platform - API Documentation

Backend API implementation using Vercel Serverless Functions with secure authentication and API key management.

## Architecture Overview

The backend API uses Vercel Serverless Functions to provide:

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **API Proxies**: Secure server-side proxies for Resend, HubSpot, and Gemini APIs
- **Rate Limiting**: Protection against abuse (5-100 requests/minute depending on endpoint)
- **Input Validation**: Type-safe validation using Zod schemas
- **CORS Protection**: Configured for production domains only
- **Error Handling**: Standardized error responses with proper HTTP status codes

## API Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "User Name",
      "role": "partner"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

**Rate Limit:** 5 requests/minute

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "1",
    "email": "user@example.com",
    "role": "partner"
  }
}
```

### Email Service (Resend Proxy)

#### POST /api/email/send
Send email via Resend API (requires authentication).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>",
  "from": "sender@partnerscrm.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "msg_abc123"
  }
}
```

**Rate Limit:** 60 requests/minute

#### POST /api/email/notification
Send notification email using template.

**Request Body:**
```json
{
  "recipientEmail": "user@example.com",
  "recipientName": "User Name",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info"
}
```

**Type Options:** `info`, `success`, `warning`, `error`, `report_available`, `admin_message`

### Gemini AI Service (Proxy)

#### POST /api/gemini/ask
Ask Gemini AI a question (requires authentication).

**Request Body:**
```json
{
  "message": "What are the benefits of this product?",
  "context": "Product: Somapay HR Platform"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "AI generated response...",
    "isFromAI": true,
    "tokens": 245
  }
}
```

#### POST /api/gemini/sales-pitch
Generate sales pitch using AI.

**Request Body:**
```json
{
  "productName": "Somapay HR",
  "clientContext": "Tech company with 50 employees"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pitch": "Generated sales pitch..."
  }
}
```

### HubSpot Service (Proxy)

#### POST /api/hubspot/create-contact
Create or update HubSpot contact (requires authentication).

**Request Body:**
```json
{
  "email": "contact@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "phone": "+55 11 99999-9999",
  "company": "Example Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "properties": { ... }
  }
}
```

#### POST /api/hubspot/validate-prospect
Validate prospect data against HubSpot.

**Request Body:**
```json
{
  "email": "prospect@example.com",
  "companyName": "Example Corp",
  "contactName": "John Doe",
  "phone": "+55 11 99999-9999"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": { ... },
    "company": { ... },
    "deals": [...],
    "status": "existing",
    "validation": {
      "emailExists": true,
      "companyExists": true,
      "hasActiveDeals": true,
      "isCustomer": false
    }
  }
}
```

## Error Responses

All errors follow a standardized format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` (401): Invalid email or password
- `ACCOUNT_INACTIVE` (401): User account is inactive
- `INVALID_REFRESH_TOKEN` (401): Refresh token is invalid or expired
- `SERVICE_UNAVAILABLE` (503): External service not configured
- `EMAIL_SEND_FAILED` (500): Failed to send email
- `AI_REQUEST_FAILED` (500): Failed to get AI response
- `HUBSPOT_API_ERROR` (500): HubSpot API error

## Rate Limiting

Rate limits are enforced per IP address or authenticated user:

- **Authentication endpoints**: 5 requests/minute
- **API endpoints**: 60 requests/minute
- **Public endpoints**: 100 requests/minute

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642245600000
```

## Security Features

### HTTPS Only
All endpoints enforce HTTPS in production.

### JWT Authentication
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Tokens are signed with HS256 algorithm

### Input Validation
All requests are validated using Zod schemas before processing.

### CORS Protection
CORS is configured to only allow requests from approved domains.

### API Key Security
All API keys are stored server-side and never exposed to the frontend.

## Environment Variables

Configure the following environment variables in Vercel:

### Required
- `JWT_SECRET` - Secret for JWT access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)

### Optional Services
- `RESEND_API_KEY` - Resend email service API key
- `HUBSPOT_ACCESS_TOKEN` - HubSpot private app access token
- `GEMINI_API_KEY` - Google Gemini AI API key
- `DEFAULT_FROM_EMAIL` - Default sender email address
- `FRONTEND_URL` - Frontend URL for CORS configuration

## Development

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with backend variables (see `.env.example.backend`)

3. Start development server:
```bash
npm run dev
```

### Testing API Endpoints

Use curl or Postman to test endpoints:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@partnerscrm.com","password":"password123"}'

# Call protected endpoint
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

## Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

Vercel will automatically detect the `api/` directory and deploy serverless functions.

## Migration from Frontend API Keys

The following services have been migrated from frontend to backend:

1. **Resend Email** - API key moved to backend
2. **HubSpot** - Access token moved to backend
3. **Gemini AI** - API key moved to backend
4. **Authentication** - JWT implementation with bcrypt password hashing

Frontend services now call `/api/*` endpoints instead of external APIs directly.

## Security Checklist

- ✅ All API keys stored server-side
- ✅ JWT authentication implemented
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Zod
- ✅ CORS protection configured
- ✅ HTTPS enforced in production
- ✅ Error messages don't leak sensitive info
- ✅ Password hashing with bcrypt
- ✅ Refresh token mechanism
- ✅ Token expiration (1h access, 7d refresh)

## Support

For issues or questions, contact the development team.
