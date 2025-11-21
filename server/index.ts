import express from 'express';
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

dotenv.config();

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
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
});

export default app;
