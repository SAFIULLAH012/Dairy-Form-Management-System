import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createHealthCareRoutes(container: AppContainer): Router {
  const router = Router();
  const { health: healthRepo, vaccine: vaccineRepo } = container.repos;
  const { healthBreeding: healthBreedingService } = container.services;

  // Health Cases
  router.get('/health/cases', async (req: Request, res: Response) => {
    try {
      const rawId = req.query.animalId as string | undefined;
      const rawStatus = req.query.status as string | undefined;
      const animalId = rawId && rawId !== 'undefined' && rawId !== 'null' ? rawId : undefined;
      const status = rawStatus && rawStatus !== 'undefined' && rawStatus !== 'null' ? rawStatus : undefined;
      const cases = await healthRepo.listCases({ animalId, status });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/health/cases', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordHealthCase(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/health/cases/:id', async (req: Request, res: Response) => {
    try {
      const updated = await healthBreedingService.updateHealthCase(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vaccinations
  router.get('/vaccinations', async (req: Request, res: Response) => {
    try {
      const rawId = req.query.animalId as string | undefined;
      const animalId = rawId && rawId !== 'undefined' && rawId !== 'null' ? rawId : undefined;
      const list = await vaccineRepo.listRecords({ animalId });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/vaccinations', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordVaccination(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

