import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createFinanceRoutes(container: AppContainer): Router {
  const router = Router();
  const { expense: expenseRepo } = container.repos;
  const { salesInvoice: salesInvoiceService } = container.services;

  router.get('/expenses', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const category = req.query.category as string | undefined;
      const list = await expenseRepo.listExpenses({ fromDate, toDate, category });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/expenses', async (req: Request, res: Response) => {
    try {
      const saved = await salesInvoiceService.recordExpense(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

