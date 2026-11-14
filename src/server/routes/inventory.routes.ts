import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createInventoryRoutes(container: AppContainer): Router {
  const router = Router();
  const { inventory: inventoryRepo } = container.repos;
  const { feedInventory: feedInventoryService } = container.services;

  router.get('/items', async (_req: Request, res: Response) => {
    try {
      const items = await feedInventoryService.getInventoryStatus();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/items', async (req: Request, res: Response) => {
    try {
      const saved = await inventoryRepo.saveItem(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      const saved = await feedInventoryService.recordStockMovement(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const txs = await inventoryRepo.listTransactions(itemId);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

