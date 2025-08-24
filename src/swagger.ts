import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response, NextFunction } from 'express';

const swaggerDocument = require('../swagger.json'); // Or use YAML if preferred

export function setupSwagger(app: Express) {
  const SWAGGER_API_KEY = process.env.SWAGGER_API_KEY || 'your-secret-key';

  app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== SWAGGER_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}