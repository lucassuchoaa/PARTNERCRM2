import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupAuth, isAuthenticated } from './replitAuth';
import { storage } from './storage';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import managersRoutes from './routes/managers';
import partnersRoutes from './routes/partners';
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
import analyticsRoutes from './routes/analytics';
import rolesRoutes from './routes/roles';
import partnerReportsRoutes from './routes/partner-reports';
import emailRoutes from './routes/email';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  console.warn('⚠️  Server will start without authentication. This is NOT recommended for production.');
}

async function startProductionServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5000', 10);
  const HOST = '0.0.0.0';

  app.use(cors({
    origin: true,
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
    // Fallback route when auth is disabled
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
      environment: process.env.NODE_ENV || 'production'
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
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/managers', managersRoutes);
  app.use('/api/partners', partnersRoutes);
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
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/partner_reports', partnerReportsRoutes);
  app.use('/api/email', emailRoutes);
  console.log('✅ Registered route: /api/partner_reports');
  console.log('✅ Registered route: /api/email');

  // Servir arquivos de uploads estáticos
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('✅ Serving uploads from:', uploadsPath);

  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log('⚠️ Unhandled API route:', req.method, req.path);
      return res.status(404).json({
        success: false,
        error: 'API route not found',
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.method === 'GET') {
      res.sendFile(join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Internal Server Error');
        }
      });
    } else {
      next();
    }
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Production server running on ${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔑 Replit Auth enabled`);
    console.log(`📁 Serving static files from: ${distPath}`);
  });

  return app;
}

// Start production server
startProductionServer().catch((error) => {
  console.error('Failed to start production server:', error);
  process.exit(1);
});
