import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { serviceProviderRoutes } from './routes/serviceProviderRoutes';
import { serviceProviderSigninRoutes } from './routes/serviceProviderSignin';
import { otpRoutes } from './routes/otpRoutes';
import consumerRoutes from './routes/consumerRoutes';
import { conversationRoutes, initializeConversationServices } from './routes/conversationRoutes';
import { prismaService } from './services/prisma.service';
import { SocketService } from './services/socket.service';
import { MessagingService } from './services/messaging.service';
import { setupSwagger } from './swagger';
import path from 'path';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize socket and messaging services
const socketService = new SocketService(server);
const messagingService = new MessagingService(socketService);

// Initialize conversation routes with services
initializeConversationServices(messagingService, socketService);

setupSwagger(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));
import smsRoutes from './routes/smsRoutes';
app.use('/api', serviceProviderRoutes);
app.use('/api', serviceProviderSigninRoutes);
app.use('/api', consumerRoutes);
app.use('/api', otpRoutes);
app.use('/api', conversationRoutes);
app.use('/sms', smsRoutes);

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
        stats: 'http://localhost:3000/api/sp-stats',
        cities: 'http://localhost:3000/api/cities',
        pending: 'http://localhost:3000/api/sp-pending',
        subscriptionStatus: 'http://localhost:3000/api/sp-subscription-status/{id}',
        renewSubscription: 'http://localhost:3000/api/sp-renew-subscription/{id} (POST)',
        signin: 'http://localhost:3000/api/sp-signin'
      },
      consumerEndpoints: {
        create: 'http://localhost:3000/api/consumer-create',
        signin: 'http://localhost:3000/api/consumer-signin',
        forgotPassword: 'http://localhost:3000/api/forgot-password (POST)'
      },
      otpEndpoints: {
        request: 'http://localhost:3000/api/otp/request (POST)',
        verify: 'http://localhost:3000/api/otp/verify (POST)',
        pinResetRequest: 'http://localhost:3000/api/otp/pin-reset-request (POST)'
      },
      pinResetEndpoints: {
        unified: 'http://localhost:3000/api/forgot-password (POST) - Works for both consumers and service providers'
      },
      conversationEndpoints: {
        // Conversation Management
        createConversation: 'http://localhost:3000/api/conversation (POST) - Create new conversation',
        updateStatus: 'http://localhost:3000/api/conversation/{id}/status (PUT)',
        
        // Message Management
        sendMessage: 'http://localhost:3000/api/message (POST) - Simple API: only requires id and content',
        getMessagesSimple: 'http://localhost:3000/api/messages?id={conversationId} (GET) - Fetch all messages by conversation id',
        markAsRead: 'http://localhost:3000/api/conversation/{id}/read (PUT)',
      }
    }
  });
});

// Database connection and server startup
async function startServer() {
  try {
    await prismaService.connect();
    
    server.listen(Number(PORT), String(HOST), () => {
      console.log('Service Provider API is running!');
      console.log(`Server: http://${HOST}:${PORT}`);
      console.log(`Socket.IO server is running on the same port`);
      // ...existing logs...
    });
  } catch (error: any) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
