import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createFeedRoutes(container: AppContainer): Router {
  const router = Router();
  const { feed: feedRepo, animal: animalRepo } = container.repos;
  const { feedInventory: feedInventoryService } = container.services;

  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const rawFrom = req.query.fromDate as string | undefined;
      const rawTo = req.query.toDate as string | undefined;
      const rawGroup = req.query.group as string | undefined;

      const fromDate = rawFrom && rawFrom !== 'undefined' && rawFrom !== 'null' ? rawFrom : undefined;
      const toDate = rawTo && rawTo !== 'undefined' && rawTo !== 'null' ? rawTo : undefined;
      const group = rawGroup && rawGroup !== 'undefined' && rawGroup !== 'null' ? rawGroup : undefined;

      const txs = await feedRepo.listTransactions(fromDate, toDate, group);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      // Auto-count all active animals in the group (Issue #28: includes all herd groups, calves, males)
      const group = req.body.group;
      let cowCount = 0;
      if (group) {
        const animals = await animalRepo.listAll({ status: 'Active', group });
        cowCount = animals.length;
      }
      const saved = await feedInventoryService.recordFeedConsumption({ ...req.body, cowCount });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

