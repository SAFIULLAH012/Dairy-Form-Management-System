import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import { AppContainer } from './src/server/container.ts';
import { createApp } from './src/server/app.ts';
import { logger } from './src/server/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const PORT = Number(process.env.PORT) || 3001;

  // 1. Initialize Dependency Injection Container & SQLite DB
  const container = new AppContainer();
  await container.init();
  logger.info('SQLite database initialized & verified.');

  // 2. Build Express Application
  const app = createApp(container);

  // 3. Mount Static Assets / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // 4. Start HTTP Server
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Dairy Farm ERP Desktop backend running at http://localhost:${PORT}`);
  });

  // 5. Graceful shutdown handler for Windows / Desktop
  const shutdown = () => {
    logger.info('Stopping Dairy Farm ERP server...');
    container.db.save();
    server.close(() => {
      logger.info('Server stopped cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

// Direct execution entry (when launched as script)
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun || !process.argv[1]) {
  startServer().catch((err) => {
    logger.error('Fatal error starting Dairy Farm ERP server:', err);
    process.exit(1);
  });
}
