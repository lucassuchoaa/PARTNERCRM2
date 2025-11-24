import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupAuth, isAuthenticated } from './replitAuth';
import { storage } from './storage';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products';
import pricingPlansRoutes from './routes/pricing-plans';
import remunerationTablesRoutes from './routes/remuneration-tables';
import supportMaterialsRoutes from './routes/support-materials';
import clientsRoutes from './routes/clients';
import transactionsRoutes from './routes/transactions';
import prospectsRoutes from './routes/prospects';
import notificationsRoutes from './routes/notifications';
import uploadsRoutes from './routes/uploads';
import nfeUploadsRoutes from './routes/nfe-uploads';
import stripeRoutes from './routes/stripe';
import initRoutes from './routes/init';

dotenv.config();

const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// ISSUER_URL has a fallback to https://replit.com/oidc, so we only need REPL_ID
const replitAuthEnabled = !!process.env.REPL_ID;

if (!replitAuthEnabled) {
  console.warn('⚠️  WARNING: Replit Auth is DISABLED - Missing REPL_ID');
  console.warn('⚠️  Authentication features will not be available.');
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [/localhost/, /127\.0\.0\.1/, /172\.\d+\.\d+\.\d+/, /\.replit\.dev$/]; // Allow localhost, 127.0.0.1, Replit IPs and Replit domains

  app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow localhost/127.0.0.1/local IPs/Replit domains
    if (process.env.NODE_ENV !== 'production') {
      const devOriginRegex = /localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|\.replit\.dev$/;
      if (devOriginRegex.test(origin)) {
        callback(null, true);
        return;
      }
    }
    
    // Always allow Replit domains (production too)
    if (/\.replit\.dev$/.test(origin)) {
      callback(null, true);
      return;
    }

    // Check if origin matches configured origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup Replit Auth (conditional)
  if (replitAuthEnabled) {
    await setupAuth(app);
    console.log('🔑 Replit Auth enabled');
    
    // Auth route - get current user
    app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });
  } else {
    // Fallback routes when auth is disabled
    app.get('/api/auth/user', (req, res) => {
      res.status(503).json({ 
        error: 'Authentication service unavailable',
        message: 'Replit Auth is not configured. Set ISSUER_URL and REPL_ID environment variables.'
      });
    });
    
    app.get('/api/login', (req, res) => {
      res.status(503).json({ 
        error: 'Authentication service unavailable',
        message: 'Replit Auth is not configured.'
      });
    });
  }

  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/status', (req, res) => {
    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/users', usersRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/pricing-plans', pricingPlansRoutes);
  app.use('/api/remuneration-tables', remunerationTablesRoutes);
  app.use('/api/support-materials', supportMaterialsRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/prospects', prospectsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/nfe_uploads', nfeUploadsRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/init', initRoutes);

  // Error handlers
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ [Server Error] Path:', req.path);
    console.error('❌ [Server Error] Method:', req.method);
    console.error('❌ [Server Error] Message:', err.message);
    console.error('❌ [Server Error] Stack:', err.stack);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Rota não encontrada',
      timestamp: new Date().toISOString()
    });
  });

  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Replit Auth enabled`);
  });

  return app;
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
