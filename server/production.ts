import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
  process.exit(1);
}

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

app.use('/api/auth', authRoutes);
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
  console.log(`📁 Serving static files from: ${distPath}`);
});

export default app;
