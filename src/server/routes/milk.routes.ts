import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createMilkRoutes(container: AppContainer): Router {
  const router = Router();
  const { milk: milkRepo } = container.repos;
  const { milk: milkService } = container.services;

  router.get('/shifts', async (_req: Request, res: Response) => {
    try {
      const shifts = await milkRepo.getShifts();
      res.json(shifts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/total', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const totals = await milkRepo.listTotalEntries(fromDate, toDate);
      res.json(totals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/total', async (req: Request, res: Response) => {
    try {
      const saved = await milkService.saveTotalMilk(req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/unlock', async (req: Request, res: Response) => {
    try {
      const { date, shift, reason } = req.body;
      const unlocked = await milkService.unlockShift(date, shift, reason);
      res.json(unlocked);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/individual', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string;
      const shift = req.query.shift as string;
      if (!date || !shift) return res.status(400).json({ error: 'date and shift are required' });
      const entries = await milkRepo.listIndividualEntries(date, shift);
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/individual', async (req: Request, res: Response) => {
    try {
      const { date, shift, entries } = req.body;
      const result = await milkService.saveIndividualShift({ date, shift, entries });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/history/:animalId', async (req: Request, res: Response) => {
    try {
      const history = await milkRepo.listAnimalMilkHistory(req.params.animalId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/corrections', async (req: Request, res: Response) => {
    try {
      await milkRepo.recordCorrection(req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/corrections', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string | undefined;
      const shift = req.query.shift as string | undefined;
      const records = await milkRepo.listCorrections(date, shift);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

