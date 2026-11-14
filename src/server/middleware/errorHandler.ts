import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.ts';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error(`API Error on ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
    params: req.params,
    query: req.query,
  });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

