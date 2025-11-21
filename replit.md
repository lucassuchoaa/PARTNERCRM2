# Partners Platform CRM

## Overview

Partners Platform CRM is a modern, enterprise-grade customer relationship management system designed specifically for managing partner networks, referrals, and commissions. Built as a serverless application with a React frontend and Express backend, the platform provides comprehensive partner management capabilities with integrated AI assistance, CRM synchronization, and commission tracking.

The platform serves three primary user roles:
- **Partners**: Manage referrals, track commissions, and access sales materials
- **Managers**: Oversee partner performance and manage team operations
- **Admins**: Full system administration including user management, product configuration, and system settings

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (Nov 21, 2025)

### Admin Navigation Redesign
- **Replaced dropdown menus** with persistent sidebar navigation (264px wide)
- **5 organized categories**: Sistema, Conteúdo, Financeiro, ChatBot IA, Integrações
- **Always visible** - eliminates extra clicks and improves discoverability
- **Visual indicators**: Active items highlighted with bg-indigo-50, hover effects
- **Heroicons** for quick identification of each section

### Production Deployment Configuration (Replit Autoscale)
- **Created `server/production.ts`**: Single server serving both static files (dist/) and API routes on port 5000
- **Updated package.json**: Added `start` and `start:backend` scripts for production
- **Configured server to listen on 0.0.0.0**: Required for Replit Autoscale deployments
- **Updated deployment config**: Uses `npm run start` instead of development commands
- **Production-ready**: Serves pre-built Vite assets with proper caching headers

### Stripe Checkout Implementation
- **Backend Routes (`/api/stripe/`):**
  - `POST /create-payment-intent`: Creates one-time payment for pricing plans
  - `POST /create-subscription`: Creates recurring subscriptions (future use)
  
- **Frontend Pages:**
  - **Checkout.tsx**: Complete payment form with Stripe Elements
  - **CheckoutSuccess.tsx**: Success page with auto-redirect to login
  
- **Integration:**
  - Landing page "Começar Agora" buttons save selected plan to localStorage
  - Redirects to #checkout route
  - Payment confirmed → #checkout-success → #login (5s auto-redirect)
  
- **Required Environment Variables:**
  - `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (frontend)
  - `STRIPE_SECRET_KEY`: Stripe secret key (backend)

### Landing Page Improvements
- **Removed non-functional links** from footer: "Sobre Nós", "Contato", "Carreiras", "Blog"
- **Kept functional links**: Pricing, Demo, Chat, "Fale Conosco"
- **Dynamic pricing section**: Single pricing display powered by database API (no duplicates)

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18.2 with TypeScript 5.2 for type-safe component development
- Vite 5.0 as the build tool with hot module replacement (HMR) for rapid development
- Hash-based routing using React Router 6.22 for client-side navigation without server configuration
- Lazy loading and code splitting for optimal bundle sizes and performance

**State Management Strategy**
- TanStack React Query 5.90 for server state management with intelligent caching, background refetching, and automatic request deduplication
- React Context API for client-side global state (authentication, user preferences)
- Local state with useState/useReducer for component-specific state

**UI Components & Styling**
- Tailwind CSS 3.4 for utility-first styling with custom configuration
- Headless UI 2.2 for accessible, unstyled components (modals, dropdowns, transitions)
- Heroicons 2.2 for consistent iconography
- Framer Motion 12.23 for smooth animations and transitions
- React Helmet Async 2.0 for SEO meta tag management

**Performance Optimizations**
- Manual vendor chunk splitting: React/React-DOM, UI libraries, and React Query separated into dedicated bundles
- Production console.log removal via vite-plugin-remove-console
- Terser minification with aggressive compression settings
- Modern ES2022+ target for smaller bundle sizes
- Source maps disabled in production builds

### Backend Architecture

**Express Server (Replit Native)**
Full-featured Express.js API running natively on Replit infrastructure:
- Full-featured Express.js API in `/server` directory
- Replit PostgreSQL database with connection pooling
- JWT-based authentication with bcrypt password hashing
- Comprehensive CRUD operations for all entities
- TypeScript implementation with strict type checking
- CORS configuration with whitelist security
- Mandatory environment variable validation

**Authentication System**
- JWT token-based authentication with separate access and refresh tokens
- Access tokens: 1 hour expiration, used for API requests
- Refresh tokens: 7 days expiration, used to obtain new access tokens
- Bcrypt password hashing with salt rounds for secure storage
- Token validation middleware for protected routes

**API Structure**
Core endpoints organized by resource:
- `/api/auth/*` - Authentication (login, refresh, current user)
- `/api/users/*` - User management (CRUD operations)
- `/api/products/*` - Product catalog management
- `/api/pricing-plans/*` - Pricing plan configuration
- `/api/remuneration-tables/*` - Commission structure management
- `/api/support-materials/*` - Marketing and sales materials
- `/api/upload/*` - File upload handling
- `/api/stripe/*` - Stripe payment processing (create-payment-intent, create-subscription)

**Database Design Principles**
- PostgreSQL relational database with normalized schema
- Snake_case naming convention for database columns
- camelCase transformation in API layer for JavaScript compatibility
- Timestamp tracking (created_at, updated_at) on all entities
- Soft delete support via status/is_active flags
- Foreign key relationships for data integrity

**Security Measures**
- CORS configuration with origin validation
- Environment variable-based secrets (never committed to repository)
- SQL injection prevention via parameterized queries
- Password hashing with bcrypt (never storing plain text)
- HTTPS enforcement in production
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options

### Data Flow

**Authentication Flow**
1. User submits credentials to `/api/auth/login`
2. Server validates credentials against database
3. Server generates access token (1h) and refresh token (7d)
4. Client stores tokens in memory/localStorage
5. Client includes access token in Authorization header for subsequent requests
6. When access token expires, client uses refresh token to obtain new access token

**API Request Flow**
1. Frontend component triggers data fetch/mutation
2. React Query checks cache for existing data
3. If cache miss or stale, request sent to backend API
4. Backend validates JWT token (if protected endpoint)
5. Backend queries database/external service
6. Response transformed to frontend format (snake_case → camelCase)
7. React Query updates cache and notifies components
8. UI re-renders with new data

**File Upload Flow**
1. User selects file(s) in frontend component
2. FormData object created with file and metadata
3. POST request to `/api/upload` with multipart/form-data
4. Backend parses multipart data using formidable
5. File uploaded to Supabase Storage bucket
6. Public URL generated and returned to frontend
7. Frontend updates UI with download/preview links

## External Dependencies

### Third-Party Services

**Replit PostgreSQL** (Primary Data Store)
- Fully managed PostgreSQL 16 database hosted on Neon
- Serverless approach with automatic scaling
- Connection pooling for optimal performance
- Automatic environment variables (DATABASE_URL, PGHOST, etc)
- No additional setup required - native to Replit

**HubSpot CRM**
- Contact and deal synchronization
- Lead management and tracking
- API client: @hubspot/api-client v13.0
- OAuth 1.0 authentication
- Required: `HUBSPOT_ACCESS_TOKEN`

**Google Gemini AI**
- Chatbot conversation handling
- Personalized sales pitch generation
- Natural language understanding for partner queries
- Free tier: 15 requests/minute
- Required: `GEMINI_API_KEY`

**Resend Email Service**
- Transactional email delivery
- Partner notifications and alerts
- API key-based authentication
- Required: `RESEND_API_KEY`

**Sentry Error Tracking**
- Production error monitoring and alerting
- Performance monitoring with Web Vitals
- Source map support for production debugging
- Optional: `VITE_SENTRY_DSN`

### Build & Development Tools

**Testing Infrastructure**
- Vitest 4.0 for unit testing with jsdom environment
- Playwright 1.56 for end-to-end testing
- Testing Library for component testing
- 84%+ test coverage requirement

**Code Quality**
- ESLint with TypeScript plugin for linting
- TypeScript strict mode enabled
- Husky for git hooks (optional)
- Prettier for code formatting (recommended but not configured)

**Deployment**
- Replit Autoscale for production hosting
- GitHub for version control
- Environment variables managed in Replit Secrets
- Automatic scaling based on traffic
- Pay-per-use pricing model

### Environment Variables

**Frontend (VITE_* prefix - exposed in bundle)**
- `VITE_APP_URL`: Application base URL
- `VITE_API_URL`: API endpoint base path
- `VITE_ENABLE_REACT_QUERY_DEVTOOLS`: Development tools toggle
- `VITE_SENTRY_DSN`: Error tracking endpoint (optional)
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key for frontend payments (required for checkout)

**Backend (Server-side only - never exposed)**
- `JWT_SECRET`: Access token signing key (required)
- `JWT_REFRESH_SECRET`: Refresh token signing key (required)
- `STRIPE_SECRET_KEY`: Stripe secret key for backend payment processing (required for checkout)
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Database credentials (auto-configured)
- `FRONTEND_URL`: Allowed CORS origins (comma-separated, optional)
- `VITE_HUBSPOT_ACCESS_TOKEN`: HubSpot API token (optional)
- `VITE_GEMINI_API_KEY`: Google AI API key (optional)
- `VITE_RESEND_API_KEY`: Email service API key (optional)