import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = require('../swagger.json'); // Or use YAML if preferred

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}