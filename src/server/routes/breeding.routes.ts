import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createBreedingRoutes(container: AppContainer): Router {
  const router = Router();
  const { breeding: breedingRepo, growth: growthRepo } = container.repos;
  const { healthBreeding: healthBreedingService } = container.services;

  // Breeding & Calving
  router.get('/breeding/records', async (req: Request, res: Response) => {
    try {
      const animalId = req.query.animalId as string | undefined;
      const records = await breedingRepo.listRecords(animalId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/breeding/records', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordBreedingEvent(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/breeding/calving', async (req: Request, res: Response) => {
    try {
      await healthBreedingService.recordCalvingWorkflow(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Growth Measurements
  router.get('/growth/:animalId', async (req: Request, res: Response) => {
    try {
      const records = await growthRepo.listByAnimal(req.params.animalId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/growth/:animalId', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordGrowthMeasurement({
        animalId: req.params.animalId,
        date: req.body.date,
        weightKg: req.body.weightKg,
        notes: req.body.notes,
      });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

