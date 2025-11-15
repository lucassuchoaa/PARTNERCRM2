# 🚀 Deploy Guide - Partners Platform

Complete deployment guide for production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Methods](#deployment-methods)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **Vercel Account**: For hosting and deployment
- **Sentry Account**: For error tracking (optional but recommended)
- **HubSpot Account**: For CRM integration
- **Google Cloud**: For Gemini AI integration

### Required Tools
- Node.js 18+
- npm or yarn
- Git
- Vercel CLI (optional): `npm i -g vercel`

---

## Environment Variables

### Required Variables

Create these environment variables in your Vercel project settings:

#### Frontend Variables
```bash
# Application URLs
VITE_APP_URL=https://your-domain.vercel.app
VITE_API_URL=https://your-domain.vercel.app/api

# Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# API Keys
VITE_HUBSPOT_API_KEY=your-hubspot-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Application Version
VITE_APP_VERSION=1.0.0
```

#### Backend Variables (Serverless Functions)
```bash
# Node Environment
NODE_ENV=production

# API Keys (same as frontend)
VITE_HUBSPOT_API_KEY=your-hubspot-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Sentry
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Optional Variables
```bash
# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_NETSUITE=false
```

---

## Deployment Methods

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "feat: prepare for production deployment"
   git push origin main
   ```

2. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables from the list above
   - Select appropriate environments (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Verify deployment at the provided URL

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   # Deploy to preview environment
   vercel

   # Or use npm script
   npm run deploy:preview
   ```

4. **Deploy to Production**
   ```bash
   # Deploy to production
   vercel --prod

   # Or use npm script
   npm run deploy:prod
   ```

### Method 3: GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Post-Deployment Verification

### Automated Health Checks

1. **Health Endpoint**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

   Expected Response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-15T10:30:00Z",
     "uptime": 3600,
     "checks": {
       "hubspot": { "status": "up", "responseTime": 150 },
       "gemini": { "status": "up", "responseTime": 200 }
     }
   }
   ```

2. **Status Endpoint**
   ```bash
   curl https://your-domain.vercel.app/api/status
   ```

### Manual Verification Checklist

- [ ] Homepage loads correctly
- [ ] Login functionality works
- [ ] Dashboard renders without errors
- [ ] API endpoints respond correctly
- [ ] HubSpot integration working
- [ ] Gemini AI chat functional
- [ ] Error tracking in Sentry
- [ ] Performance monitoring active
- [ ] Security headers present
- [ ] SSL certificate valid

### Performance Verification

```bash
# Run Lighthouse audit
npm run lighthouse

# Check Core Web Vitals
# Visit: https://pagespeed.web.dev/
# Enter your production URL
```

### Smoke Tests Script

```bash
# Run smoke tests
npm run smoke-test

# Or manually test critical paths:
curl -I https://your-domain.vercel.app
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/status
```

---

## Rollback Procedures

### Immediate Rollback (Emergency)

1. **Via Vercel Dashboard**
   - Go to Deployments tab
   - Find last stable deployment
   - Click "Promote to Production"
   - Confirm promotion

2. **Via Vercel CLI**
   ```bash
   # List recent deployments
   vercel ls

   # Promote specific deployment
   vercel promote <deployment-url>
   ```

3. **Expected Rollback Time**: < 2 minutes

### Rollback with Verification

1. **Identify Issue**
   - Check Sentry for errors
   - Review deployment logs
   - Verify health checks

2. **Communicate**
   - Notify team via Slack/Email
   - Document incident in issue tracker
   - Update status page (if applicable)

3. **Execute Rollback**
   - Promote last stable deployment
   - Verify rollback success
   - Monitor error rates

4. **Post-Rollback**
   - Investigate root cause
   - Create fix in development
   - Test thoroughly before redeployment

---

## Disaster Recovery

### Scenario 1: Complete Service Outage

**Symptoms**: Site completely unavailable

**Steps**:
1. Check Vercel Status: https://www.vercel-status.com/
2. Verify DNS settings
3. Check SSL certificate validity
4. Review recent deployments
5. Rollback to last known good state
6. Contact Vercel support if needed

**Recovery Time Objective (RTO)**: < 15 minutes

### Scenario 2: Database Corruption

**Symptoms**: Data inconsistencies, API errors

**Steps**:
1. Enable maintenance mode (if available)
2. Restore from latest backup
3. Verify data integrity
4. Run migration scripts if needed
5. Test critical paths
6. Disable maintenance mode

**RTO**: < 30 minutes

### Scenario 3: API Integration Failure

**Symptoms**: HubSpot/Gemini errors, integration timeouts

**Steps**:
1. Check API status pages
2. Verify API credentials
3. Review rate limits
4. Enable graceful degradation
5. Notify users of limited functionality
6. Monitor for recovery

**RTO**: Depends on external provider

### Scenario 4: Security Breach

**Symptoms**: Unauthorized access, data leak

**Steps**:
1. **IMMEDIATE**: Revoke all API keys
2. Take affected services offline
3. Notify security team
4. Investigate breach scope
5. Rotate all credentials
6. Deploy security patches
7. Notify affected users (if required)
8. Document incident

**RTO**: Security-first, recovery time secondary

---

## Troubleshooting

### Build Failures

**Error**: `npm run build` fails

**Solutions**:
1. Clear cache: `npm run clean && npm ci`
2. Check TypeScript errors: `npm run type-check`
3. Verify environment variables are set
4. Check Node.js version: `node -v` (must be 18+)
5. Review build logs in Vercel dashboard

### Runtime Errors

**Error**: 500 Internal Server Error

**Solutions**:
1. Check Sentry for error details
2. Review serverless function logs
3. Verify environment variables in production
4. Test API endpoints individually
5. Check external API availability

### Performance Issues

**Symptoms**: Slow page loads, timeouts

**Solutions**:
1. Review bundle size: `npm run build:analyze`
2. Check Core Web Vitals in production
3. Verify CDN caching working
4. Review serverless function cold starts
5. Optimize images and assets

### Integration Failures

**Symptoms**: HubSpot/Gemini not working

**Solutions**:
1. Verify API keys in Vercel settings
2. Check API rate limits
3. Review API status pages
4. Test API endpoints directly
5. Check CORS configuration

---

## Emergency Contacts

### Team
- **Tech Lead**: [contact-info]
- **DevOps**: [contact-info]
- **On-Call Engineer**: [contact-info]

### External Support
- **Vercel Support**: https://vercel.com/support
- **Sentry Support**: https://sentry.io/support
- **HubSpot Support**: https://help.hubspot.com/

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Team notified

### During Deployment
- [ ] Monitor build logs
- [ ] Watch error tracking
- [ ] Verify health checks
- [ ] Test critical paths
- [ ] Check performance metrics

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Monitoring dashboards checked
- [ ] No error spikes in Sentry
- [ ] Performance within acceptable range
- [ ] Team notified of success
- [ ] Documentation updated
- [ ] Deployment tagged in git

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Availability**: Uptime percentage
2. **Performance**: Response times, Core Web Vitals
3. **Errors**: Error rate, error types
4. **Traffic**: Request volume, geographic distribution
5. **Resources**: Function execution time, memory usage

### Alert Thresholds

- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Response time > 3s: Warning
- Response time > 5s: Critical
- Uptime < 99.9%: Critical

### Monitoring Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance
- **Custom**: `/api/health` endpoint monitoring

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [Project Architecture](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Main README](./README.md)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
