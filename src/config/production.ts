export const productionConfig = {
  // Server configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // Database configuration
  database: {
    type: 'postgresql' as const,
    database: process.env.DATABASE_PATH || 'service_providers.db',
    entities: [__dirname + '/../entities/*.js'],
    synchronize: false, // Disable auto-sync in production
    logging: false,
    migrations: [],
    subscribers: []
  },
  
  // CORS configuration for Hojaega.pk (Production)
  cors: {
    origin: [
      'https://Hojaega.pk',
      'https://www.Hojaega.pk'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  },
  
  // Security settings
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: true,
    compression: true
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
};
