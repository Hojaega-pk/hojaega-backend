import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { serviceProviderRoutes } from './routes/serviceProviderRoutes';
import { serviceProviderSigninRoutes } from './routes/serviceProviderSignin';
import consumerRoutes from './routes/consumerRoutes';
import { prismaService } from './services/prisma.service';
import { setupSwagger } from './swagger';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger
setupSwagger(app);

// Static files for screenshots
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));

// Ensure screenshots directory exists
import fs from 'fs';
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Enhanced CORS middleware for production
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://hojaega.pk',
    'https://www.hojaega.pk',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api', serviceProviderRoutes);
app.use('/api', serviceProviderSigninRoutes);
app.use('/api', consumerRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Service Provider API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Service Provider API',
    domain: 'Hojaega.pk (Production)',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/api/docs',
      spEndpoints: {
        create: '/api/sp-create',
        list: '/api/sp-list',
        get: '/api/sp-get/{id}',
        update: '/api/sp-update/{id}',
        delete: '/api/sp-delete/{id}',
        filter: '/api/sp-filter (POST)',
        stats: '/api/sp-stats',
        cities: '/api/cities',
        pending: '/api/sp-pending',
        subscriptionStatus: '/api/sp-subscription-status/{id}',
        renewSubscription: '/api/sp-renew-subscription/{id} (POST)',
        paymentUpload: '/api/payment-upload',
        signin: '/api/sp-signin'
      },
             consumerEndpoints: {
         create: '/api/consumer-create',
         signin: '/api/consumer-signin'
       }
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Database connection and server startup
async function startServer() {
  try {
    await prismaService.connect();
    
    app.listen(Number(PORT), String(HOST), () => {
      console.log('✅ Service Provider API is running!');
      console.log(`Server: http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`Health check: /health`);
      console.log(`API endpoints: /api`);
    });
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prismaService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prismaService.disconnect();
  process.exit(0);
});
