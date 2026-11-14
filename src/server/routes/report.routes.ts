import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createReportRoutes(container: AppContainer): Router {
  const router = Router();
  const { report: reportService } = container.services;

  router.get('/financial', async (req: Request, res: Response) => {
    try {
      const fromDate = (req.query.fromDate as string) || new Date().toISOString().slice(0, 7) + '-01';
      const toDate = (req.query.toDate as string) || new Date().toISOString().slice(0, 10);
      const report = await reportService.generateFinancialReport(fromDate, toDate);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/herd', async (_req: Request, res: Response) => {
    try {
      const stats = await reportService.getHerdStatistics();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

