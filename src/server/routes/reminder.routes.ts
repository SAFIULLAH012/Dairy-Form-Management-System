import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createReminderRoutes(container: AppContainer): Router {
  const router = Router();
  const { reminder: reminderRepo } = container.repos;
  const { reminder: reminderService } = container.services;

  router.get('/', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const tasks = await reminderRepo.listTasks(status);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const task = {
        ...req.body,
        id: req.body.id || `TASK_${Date.now()}`,
        status: req.body.status || 'Due',
        createdAt: new Date().toISOString(),
      };
      const saved = await reminderRepo.saveTask(task);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/:id/complete', async (req: Request, res: Response) => {
    try {
      await reminderRepo.completeTask(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await reminderRepo.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/notifications', async (_req: Request, res: Response) => {
    try {
      const summary = await reminderService.getNotificationCenterSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

