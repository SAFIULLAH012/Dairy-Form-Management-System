import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createFeedRoutes(container: AppContainer): Router {
  const router = Router();
  const { feed: feedRepo, animal: animalRepo } = container.repos;
  const { feedInventory: feedInventoryService } = container.services;

  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const group = req.query.group as string | undefined;
      const txs = await feedRepo.listTransactions(fromDate, toDate, group);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      // Auto-count active cows in the group so per-cow cost can be derived
      const group = req.body.group;
      let cowCount = 0;
      if (group) {
        const cows = await animalRepo.listAll({ sex: 'Female', status: 'Active', group });
        cowCount = cows.length;
      }
      const saved = await feedInventoryService.recordFeedConsumption({ ...req.body, cowCount });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

