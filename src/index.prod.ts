import 'reflect-metadata';
import express = require('express');
import { Request, Response, NextFunction } from 'express';
import { createConnection } from 'typeorm';
import { ServiceProvider } from './entities/ServiceProvider';
import { serviceProviderRoutes } from './routes/serviceProviderRoutes';
import consumerRoutes from './routes/consumerRoutes';
import { productionConfig } from './config/production';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = productionConfig.port;
const HOST = productionConfig.host;

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit(productionConfig.security.rateLimit);
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS middleware for Hojaega.pk
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (origin && productionConfig.cors.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', productionConfig.cors.methods.join(', '));
  res.header('Access-Control-Allow-Headers', productionConfig.cors.allowedHeaders.join(', '));
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
app.use('/api', consumerRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Service Provider API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Service Provider API',
    domain: 'Hojaega.pk (Production)',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: 'https://Hojaega.pk/health',
      api: 'https://Hojaega.pk/api',
      documentation: 'https://Hojaega.pk/api/docs',
      spEndpoints: {
        create: 'https://Hojaega.pk/api/sp-create',
        list: 'https://Hojaega.pk/api/sp-list',
        get: 'https://Hojaega.pk/api/sp-get/{id}',
        update: 'https://Hojaega.pk/api/sp-update/{id}',
        delete: 'https://Hojaega.pk/api/sp-delete/{id}',
        filter: 'https://Hojaega.pk/api/sp-filter (POST)',
        stats: 'https://Hojaega.pk/api/sp-stats',
        cities: 'https://Hojaega.pk/api/cities'
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
createConnection(productionConfig.database)
  .then(() => {
    console.log('✅ Database connected successfully');
    
    app.listen(Number(PORT), String(HOST), () => {
      console.log('Service Provider API is running!');
      console.log(`Server: http://${HOST}:${PORT}`);
      console.log(`Domain: Hojaega.pk`);
      console.log(`Health check: https://Hojaega.pk/health`);
      console.log(`API endpoints:`);
      console.log(`   • Create: https://Hojaega.pk/api/sp-create`);
      console.log(`   • List: https://Hojaega.pk/api/sp-list`);
      console.log(`   • Get: https://Hojaega.pk/api/sp-get/{id}`);
      console.log(`   • Update: https://Hojaega.pk/api/sp-update/{id}`);
      console.log(`   • Delete: https://Hojaega.pk/api/sp-delete/{id}`);
      console.log(`   • Filter: https://Hojaega.pk/api/sp-filter (POST)`);
      console.log(`   • Stats: https://Hojaega.pk/api/sp-stats`);
      console.log(`   • Cities: https://Hojaega.pk/api/cities`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
