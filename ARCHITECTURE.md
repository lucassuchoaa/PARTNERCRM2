# 🏗️ Architecture Documentation - Partners Platform

Comprehensive system architecture and design documentation.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Scalability](#scalability)

---

## System Overview

Partners Platform is a modern CRM system designed for managing partner relationships, referrals, and commissions. Built as a serverless application on Vercel with React frontend and TypeScript throughout.

### Key Features
- Partner dashboard with real-time metrics
- HubSpot CRM integration
- AI-powered chatbot (Gemini)
- NetSuite integration (planned)
- Commission tracking
- Referral management
- Document management

### Design Principles
- **Performance**: Sub-3s load times, optimized bundles
- **Security**: Defense in depth, zero trust
- **Maintainability**: Clean code, comprehensive docs
- **Scalability**: Serverless architecture, CDN delivery
- **User Experience**: Accessible, responsive, intuitive

---

## Architecture Diagrams

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  - Global CDN                                                │
│  - SSL/TLS Termination                                       │
│  - DDoS Protection                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │   Referrals  │  │   Reports    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Settings   │  │   Clients    │  │   Materials  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Serverless API (Vercel Functions)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Health    │  │    Status    │  │   Analytics  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   HubSpot    │  │    Gemini    │  │   NetSuite   │       │
│  │     CRM      │  │      AI      │  │     ERP      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring & Observability                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Sentry    │  │    Vercel    │  │  Web Vitals  │       │
│  │    Errors    │  │   Analytics  │  │  Performance │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Browser
     │
     │ HTTPS
     ▼
┌─────────────────┐
│  React Router   │
│  (Hash Routing) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        Component Layer                  │
│  ┌────────────┐  ┌────────────┐         │
│  │  Dashboard │  │  Settings  │         │
│  └──────┬─────┘  └──────┬─────┘         │
│         │               │               │
│         └───────┬───────┘               │
│                 ▼                       │
│        ┌────────────────┐               │
│        │  React Query   │               │
│        │    (Cache)     │               │
│        └────────┬───────┘               │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  ┌──────────┐  ┌──────────┐             │
│  │   Auth   │  │ HubSpot  │             │
│  └────┬─────┘  └────┬─────┘             │
│       │             │                   │
│       └──────┬──────┘                   │
└──────────────┼──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       External APIs                     │
│  - HubSpot CRM                          │
│  - Gemini AI                            │
│  - NetSuite (future)                    │
└─────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

**Core**
- React 18.2 - UI library
- TypeScript 5.2 - Type safety
- Vite 5.0 - Build tool & dev server

**UI & Styling**
- Tailwind CSS 3.4 - Utility-first CSS
- Headless UI 2.2 - Accessible components
- Heroicons 2.2 - Icon library
- Framer Motion 12 - Animations

**State Management**
- React Query 5.90 - Server state
- React Context - Local state
- localStorage - Persistence

**Routing**
- React Router 6.22 - Client-side routing
- Hash-based routing - SPA compatibility

**SEO & Meta**
- React Helmet Async 2.0 - Meta tags management

### Backend (Serverless)

**Runtime**
- Node.js 18.x - Vercel Functions
- TypeScript - Type safety

**External APIs**
- HubSpot API 13.0 - CRM integration
- Gemini AI - Chatbot functionality
- Resend 4.7 - Email service

### Build & Development

**Build Tools**
- Vite - Fast HMR, optimized builds
- Terser - JS minification
- PostCSS - CSS processing
- Autoprefixer - Browser compatibility

**Code Quality**
- ESLint 8.55 - Linting
- TypeScript - Type checking
- React Hooks Plugin - Hooks rules

**Development**
- JSON Server 1.0 - Mock API
- React Query Devtools - State debugging

### Monitoring & Observability

**Error Tracking**
- Sentry React - Error monitoring
- Error boundaries - React error handling

**Performance**
- Web Vitals - Core metrics tracking
- Vercel Analytics - Real user monitoring

**Health Checks**
- Custom health endpoints
- External API monitoring

### Infrastructure

**Hosting**
- Vercel - Serverless platform
- Edge Network - Global CDN
- Serverless Functions - API endpoints

**Security**
- Vercel SSL - HTTPS encryption
- Security headers - CSP, HSTS, etc.
- Environment variables - Secrets management

---

## Component Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                      # UI Components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── ManagerDashboard.tsx # Manager view
│   │   ├── Login.tsx           # Authentication
│   │   ├── Referrals.tsx       # Referral management
│   │   ├── Clients.tsx         # Client management
│   │   ├── Reports.tsx         # Reporting
│   │   ├── Settings.tsx        # User settings
│   │   ├── Profile.tsx         # User profile
│   │   ├── ChatBot.tsx         # AI chatbot
│   │   ├── HubSpotIntegration.tsx
│   │   ├── NetSuiteIntegration.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── Navigation.tsx      # Main navigation
│   │   └── SEO.tsx            # SEO component
│   ├── examples/               # Example components
│   └── ErrorBoundary.tsx      # Error handling
│
├── pages/                      # Page components
│   ├── LandingPage.tsx        # Public landing
│   └── PricingPage.tsx        # Pricing page
│
├── services/                   # Business logic
│   ├── auth.ts                # Authentication
│   └── hubspot.ts             # HubSpot service
│
├── config/                     # Configuration
│   ├── sentry.config.ts       # Error tracking
│   └── performance.config.ts  # Performance monitoring
│
├── lib/                        # Utilities
│   └── queryClient.ts         # React Query config
│
├── types/                      # TypeScript types
│   └── index.ts
│
├── assets/                     # Static assets
│
└── main.tsx                    # App entry point
```

### Component Patterns

**Lazy Loading**
```typescript
const Dashboard = lazy(() => import('./components/ui/Dashboard'))
```

**Error Boundaries**
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Suspense**
```typescript
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### State Management Strategy

**Server State** (React Query)
- API responses
- Cache management
- Background refetching
- Optimistic updates

**Client State** (React Context/Hooks)
- User authentication
- UI state (modals, forms)
- Theme preferences
- Navigation state

**Persistent State** (localStorage)
- User credentials
- User preferences
- Draft data

---

## Data Flow

### Authentication Flow

```
1. User enters credentials
   │
   ▼
2. Login.tsx validates input
   │
   ▼
3. auth.ts checks credentials
   │
   ├─ Success
   │  ├─ Store user in localStorage
   │  ├─ Set Sentry user context
   │  └─ Redirect to dashboard
   │
   └─ Failure
      └─ Show error message
```

### HubSpot Integration Flow

```
1. User action (create contact, deal, etc.)
   │
   ▼
2. UI Component calls service
   │
   ▼
3. hubspot.ts service
   │
   ├─ Validate data
   ├─ Add API key to headers
   ├─ Make API request
   │
   ▼
4. HubSpot API
   │
   ├─ Success
   │  ├─ Update React Query cache
   │  ├─ Show success notification
   │  └─ Refresh data
   │
   └─ Failure
      ├─ Log to Sentry
      ├─ Show error message
      └─ Retry logic (if applicable)
```

### Performance Monitoring Flow

```
User visits page
   │
   ▼
Web Vitals measurement starts
   │
   ├─ LCP (Largest Contentful Paint)
   ├─ FID (First Input Delay)
   ├─ CLS (Cumulative Layout Shift)
   ├─ FCP (First Contentful Paint)
   └─ TTFB (Time to First Byte)
   │
   ▼
Metrics sent to:
   ├─ Sentry (measurements)
   ├─ Vercel Analytics
   └─ Custom analytics endpoint
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- Vercel Edge Network
- DDoS protection
- Rate limiting

**Layer 2: Transport**
- SSL/TLS encryption
- HSTS headers
- Certificate pinning

**Layer 3: Application**
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Input validation
- Output encoding

**Layer 4: Data**
- API key encryption
- Secure credential storage
- Data sanitization
- PII protection

### Security Headers

```typescript
// Configured in vercel.json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; ..."
}
```

### Authentication Security

- Credentials stored in localStorage (encrypted in transit)
- Session timeout
- Role-based access control (RBAC)
- API key rotation support

### API Security

- API keys in environment variables
- Never exposed in client code
- Serverless functions for sensitive operations
- Request validation
- Response sanitization

---

## Performance Considerations

### Bundle Optimization

**Code Splitting**
```typescript
// Manual chunks for vendor code
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'ui-vendor': ['@headlessui/react', '@heroicons/react'],
  'query-vendor': ['@tanstack/react-query']
}
```

**Lazy Loading**
- Route-based code splitting
- Component-level lazy loading
- Dynamic imports for heavy libraries

**Tree Shaking**
- ES modules for better tree shaking
- Named imports from libraries
- Unused code elimination

### Caching Strategy

**Static Assets**
- Immutable cache for versioned assets (1 year)
- Cache-Control headers optimized
- CDN edge caching

**API Responses**
- React Query caching (5 min default)
- Stale-while-revalidate
- Background refetching

**Build Artifacts**
- Source maps disabled in production
- Minification with Terser
- Compression enabled

### Performance Budgets

**Bundle Size**
- Initial bundle: < 500 KB
- Total bundle: < 2 MB
- Individual chunks: < 200 KB

**Load Times**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTFB: < 800ms

---

## Scalability

### Horizontal Scaling

**Serverless Architecture**
- Auto-scaling Vercel functions
- No server management
- Pay-per-use pricing
- Global edge network

**CDN Distribution**
- Assets served from edge locations
- Reduced latency worldwide
- Automatic failover

### Vertical Scaling

**Function Limits**
- 10s timeout per function
- Concurrent executions: auto-scaled
- Memory: 1024 MB default

**Database Considerations** (Future)
- Connection pooling
- Read replicas
- Caching layer

### Performance at Scale

**Optimization Strategies**
- Lazy loading for large datasets
- Virtual scrolling for long lists
- Pagination for API responses
- Debouncing for search/filters
- Memoization for expensive computations

**Monitoring at Scale**
- Error rate tracking
- Response time monitoring
- Resource utilization alerts
- Traffic pattern analysis

---

## Future Enhancements

### Planned Features
- [ ] NetSuite ERP integration
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSockets)
- [ ] Multi-language support
- [ ] Dark mode

### Technical Debt
- [ ] Migrate to Next.js for SSR
- [ ] Implement proper database
- [ ] Add E2E testing (Playwright)
- [ ] Improve TypeScript coverage
- [ ] Add API documentation (OpenAPI)

### Performance Improvements
- [ ] Implement service worker
- [ ] Add offline support
- [ ] Optimize image loading
- [ ] Reduce third-party dependencies
- [ ] Implement request batching

---

## Additional Resources

- [Deployment Guide](./DEPLOY.md)
- [API Documentation](./API.md)
- [Main README](./README.md)
- [HubSpot Integration](./HUBSPOT_INTEGRATION.md)
- [NetSuite Integration](./NETSUITE_INTEGRATION.md)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
