import express = require('express');
import { Request, Response, NextFunction } from 'express';
import { serviceProviderRoutes } from './routes/serviceProviderRoutes';
import { prismaService } from './services/prisma.service';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for localhost (will be updated to Hojaega.pk when deployed)
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
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

// Routes
app.use('/api', serviceProviderRoutes);

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
    domain: 'localhost:3000 (Development)',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: 'http://localhost:3000/health',
      api: 'http://localhost:3000/api',
      documentation: 'http://localhost:3000/api/docs',
      spEndpoints: {
        create: 'http://localhost:3000/api/sp-create',
        list: 'http://localhost:3000/api/sp-list',
        get: 'http://localhost:3000/api/sp-get/{id}',
        update: 'http://localhost:3000/api/sp-update/{id}',
        delete: 'http://localhost:3000/api/sp-delete/{id}',
        filter: 'http://localhost:3000/api/sp-filter (POST)',
        stats: 'http://localhost:3000/api/sp-stats'
      }
    }
  });
});

// Database connection and server startup
async function startServer() {
  try {
    await prismaService.connect();
    
    app.listen(Number(PORT), String(HOST), () => {
      console.log('Service Provider API is running!');
      console.log(`Server: http://${HOST}:${PORT}`);
      console.log(`Domain: localhost:3000 (Development)`);
      console.log(`Health check: http://localhost:3000/health`);
      console.log(`API endpoints:`);
      console.log(`   • Create: http://localhost:3000/api/sp-create`);
      console.log(`   • List: http://localhost:3000/api/sp-list`);
      console.log(`   • Get: http://localhost:3000/api/sp-get/{id}`);
      console.log(`   • Update: http://localhost:3000/api/sp-update/{id}`);
      console.log(`   • Delete: http://localhost:3000/api/sp-delete/{id}`);
      console.log(`   • Filter: http://localhost:3000/api/sp-filter (POST)`);
      console.log(`   • Stats: http://localhost:3000/api/sp-stats`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
