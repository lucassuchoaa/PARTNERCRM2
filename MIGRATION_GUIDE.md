# Migration Guide - Backend API Implementation

This guide explains how to migrate from the old frontend-based API calls to the new secure backend API.

## Overview

**What Changed:**
- All API keys moved from frontend to backend
- New JWT-based authentication system
- Centralized API client with automatic token refresh
- Serverless functions for secure API proxies

**Why:**
- Prevent API key exposure in frontend bundle
- Implement proper authentication and authorization
- Add rate limiting and security controls
- Follow security best practices

## Step-by-Step Migration

### 1. Update Environment Variables

**Old (.env.local):**
```bash
VITE_RESEND_API_KEY=re_xxx
VITE_HUBSPOT_API_KEY=xxx
VITE_GEMINI_API_KEY=AIza_xxx
```

**New (.env.local):**
```bash
VITE_APP_URL=http://localhost:5173
VITE_API_URL=/api
```

**Backend Variables (Configure in Vercel):**
```bash
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
RESEND_API_KEY=re_xxx
HUBSPOT_ACCESS_TOKEN=pat-na1-xxx
GEMINI_API_KEY=AIza_xxx
```

### 2. Update Authentication Code

**Old (src/services/auth.ts):**
```typescript
import { API_URL } from '../config/api'

export async function login({ email, password }: LoginCredentials): Promise<User> {
  const response = await fetch(`${API_URL}/users?email=${email}`)
  const users = await response.json()
  const user = users[0]

  if (user.password !== password) {
    throw new Error('Invalid password')
  }

  localStorage.setItem('user', JSON.stringify(user))
  return user
}
```

**New (src/services/api/authService.ts):**
```typescript
import { apiClient, setStoredTokens } from './client'

export async function login(credentials: LoginRequest): Promise<User> {
  const response = await apiClient.post('/auth/login', credentials)
  const { user, accessToken, refreshToken } = response.data.data

  setStoredTokens({ accessToken, refreshToken, user })
  return user
}
```

### 3. Update Service Imports

**Old:**
```typescript
import { login, getCurrentUser, logout } from '../services/auth'
import { sendEmail } from '../services/emailService'
import { askGemini } from '../services/geminiService'
import HubSpotService from '../services/hubspot'
```

**New:**
```typescript
import { login, getCurrentUser, logout } from '../services/api/authService'
import { sendEmail } from '../services/api/emailService'
import { askGemini } from '../services/api/geminiService'
import { validateProspectData } from '../services/api/hubspotService'
```

### 4. Update Email Service Calls

**Old:**
```typescript
import { emailService } from '../services/emailService'

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>'
})
```

**New:**
```typescript
import { sendEmail } from '../services/api/emailService'

await sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>'
})
```

### 5. Update AI Service Calls

**Old:**
```typescript
import { askGemini } from '../services/geminiService'

const result = await askGemini('Question', 'Context')
console.log(result.response)
```

**New:**
```typescript
import { askGemini } from '../services/api/geminiService'

const result = await askGemini('Question', 'Context')
console.log(result.response)
```

### 6. Update HubSpot Service Calls

**Old:**
```typescript
import HubSpotService from '../services/hubspot'

const hubspot = new HubSpotService({
  accessToken: import.meta.env.VITE_HUBSPOT_API_KEY
})

const validation = await hubspot.validateProspectData({
  email: 'prospect@example.com',
  companyName: 'Company',
  contactName: 'Name'
})
```

**New:**
```typescript
import { validateProspectData } from '../services/api/hubspotService'

const validation = await validateProspectData({
  email: 'prospect@example.com',
  companyName: 'Company',
  contactName: 'Name'
})
```

## Component Updates

### Login Component

**Key Changes:**
- Use new auth service
- Handle JWT tokens
- Store tokens securely

**Example:**
```typescript
import { login } from '../services/api/authService'

const handleLogin = async (email: string, password: string) => {
  try {
    const user = await login({ email, password })
    // User and tokens are automatically stored
    navigate('/dashboard')
  } catch (error) {
    setError(error.message)
  }
}
```

### Protected Routes

Add authentication check:

```typescript
import { isAuthenticated } from '../services/api/client'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />
  }

  return children
}
```

## Testing

### 1. Test Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@partnerscrm.com","password":"password123"}'

# Expected response:
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### 2. Test Protected Endpoint

```bash
# Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

### 3. Test Email Service

```bash
# Send email
curl -X POST http://localhost:3000/api/email/send \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### 4. Run Security Check

```bash
npm run build
./scripts/check-security.sh
```

Expected output:
```
✅ SECURITY CHECK PASSED
No API keys or secrets found in bundle
```

## Deployment Checklist

### Vercel Configuration

1. **Add Environment Variables:**
   - Go to Vercel Project Settings > Environment Variables
   - Add all variables from `.env.example.backend`
   - Generate secure JWT secrets: `openssl rand -base64 32`

2. **Configure Domains:**
   - Set `FRONTEND_URL` to your production domain
   - Update CORS settings if needed

3. **Test Deployment:**
   - Deploy to preview environment first
   - Test all API endpoints
   - Verify authentication flow
   - Check security headers

### Post-Deployment Verification

1. **Check Bundle:**
```bash
npm run build
./scripts/check-security.sh
```

2. **Test Authentication:**
- Login with test credentials
- Verify token refresh works
- Check protected routes

3. **Test API Proxies:**
- Send test email
- Call AI service
- Validate HubSpot integration

4. **Monitor Logs:**
- Check Vercel function logs
- Monitor error rates
- Verify rate limiting

## Common Issues

### Issue: 401 Unauthorized

**Cause:** Missing or expired token

**Solution:**
```typescript
// Check if authenticated
import { isAuthenticated } from '../services/api/client'

if (!isAuthenticated()) {
  // Redirect to login
}
```

### Issue: CORS Error

**Cause:** Frontend URL not in allowed origins

**Solution:**
Add your domain to `ALLOWED_ORIGINS` in `api/_middleware/cors.ts`

### Issue: Rate Limit Exceeded

**Cause:** Too many requests

**Solution:**
Check rate limit headers and implement client-side throttling

### Issue: API Key Not Configured

**Cause:** Missing environment variable in Vercel

**Solution:**
Add the required environment variable in Vercel project settings

## Rollback Plan

If issues occur, you can temporarily rollback:

1. Restore old service files
2. Re-add VITE_* API keys to .env.local
3. Update imports back to old services
4. Rebuild and redeploy

**Note:** This is temporary - security vulnerabilities remain with frontend API keys.

## Security Improvements

✅ **Implemented:**
- All API keys stored server-side
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation with Zod
- CORS protection
- HTTPS enforcement
- Error messages don't leak sensitive info

✅ **Removed:**
- API keys from frontend bundle
- Direct external API calls from browser
- Plain text password comparison
- localStorage authentication (replaced with JWT)

## Support

For issues or questions:
1. Check API_DOCUMENTATION.md
2. Review error logs in Vercel dashboard
3. Test with curl/Postman to isolate frontend vs backend issues
4. Contact development team

## Next Steps

After migration:
1. Delete old service files (optional, keep for reference initially)
2. Update .env.local to remove old API keys
3. Rotate all API keys for security
4. Monitor production logs for issues
5. Set up alerts for API errors
