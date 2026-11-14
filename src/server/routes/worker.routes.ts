import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createWorkerRoutes(container: AppContainer): Router {
  const router = Router();
  const { worker: workerRepo } = container.repos;
  const { salesInvoice: salesInvoiceService } = container.services;

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const list = await workerRepo.listWorkers();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const worker = {
        ...req.body,
        id: req.body.id || `WRK_${Date.now()}`,
        createdAt: req.body.createdAt || new Date().toISOString(),
      };
      const saved = await workerRepo.saveWorker(worker);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:id/ledger', async (req: Request, res: Response) => {
    try {
      const ledger = await salesInvoiceService.getWorkerLedger(req.params.id);
      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/transactions', async (req: Request, res: Response) => {
    try {
      const tx = await salesInvoiceService.recordWorkerTransaction({
        workerId: req.params.id,
        ...req.body,
      });
      res.status(201).json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

