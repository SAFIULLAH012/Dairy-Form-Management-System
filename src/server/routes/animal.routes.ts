import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createAnimalRoutes(container: AppContainer): Router {
  const router = Router();
  const { animal: animalService } = container.services;

  router.get('/', async (req: Request, res: Response) => {
    try {
      const rawSex = req.query.sex as string | undefined;
      const rawStatus = req.query.status as string | undefined;
      const rawGroup = req.query.group as string | undefined;

      const sex = rawSex && rawSex !== 'undefined' && rawSex !== 'null' ? (rawSex as 'Female' | 'Male') : undefined;
      const status = rawStatus && rawStatus !== 'undefined' && rawStatus !== 'null' ? rawStatus : undefined;
      const group = rawGroup && rawGroup !== 'undefined' && rawGroup !== 'null' ? rawGroup : undefined;

      const animals = await animalService.listAnimals({ sex, status, group });
      res.json(animals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const animal = await animalService.getAnimal(req.params.id);
      if (!animal) return res.status(404).json({ error: 'Animal not found' });
      res.json(animal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const saved = await animalService.registerAnimal(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const updated = await animalService.updateAnimal(req.params.id, req.body, req.body.reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/:id/sold', async (req: Request, res: Response) => {
    try {
      const { saleDate, buyer, salePrice, notes } = req.body;
      const updated = await animalService.markSold(req.params.id, saleDate, buyer, salePrice, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/:id/deceased', async (req: Request, res: Response) => {
    try {
      const { deathDate, deathReason, notes } = req.body;
      const updated = await animalService.markDeceased(req.params.id, deathDate, deathReason, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:id/timeline', async (req: Request, res: Response) => {
    try {
      const timeline = await animalService.getTimeline(req.params.id);
      res.json(timeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/bulk/group', async (req: Request, res: Response) => {
    try {
      const { animalIds, newGroup, reason } = req.body;
      const updated = await animalService.bulkUpdateGroup(animalIds, newGroup, reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

