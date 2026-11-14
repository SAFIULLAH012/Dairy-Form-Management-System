import express, { Express } from 'express';
import { AppContainer } from './container.ts';
import { createApiRouter } from './routes/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';

export function createApp(container: AppContainer): Express {
  const app = express();

  // Desktop standard parsing with 50mb limit for large backups and attachments
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount modular API router
  app.use('/api', createApiRouter(container));

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

