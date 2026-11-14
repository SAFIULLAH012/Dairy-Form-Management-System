import { Router, Request, Response } from 'express';

export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      platform: 'desktop',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}

