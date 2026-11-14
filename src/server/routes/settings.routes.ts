import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createSettingsRoutes(container: AppContainer): Router {
  const router = Router();
  const { settings: settingsRepo } = container.repos;
  const { auditBackup: auditBackupService } = container.services;

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const settings = await settingsRepo.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const saved = await settingsRepo.saveSettings({
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/groups', async (_req: Request, res: Response) => {
    try {
      const groups = await settingsRepo.getGroups();
      res.json(groups);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/groups', async (req: Request, res: Response) => {
    try {
      const { groups } = req.body;
      await settingsRepo.saveGroups(groups);
      res.json({ success: true, groups });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const health = await auditBackupService.getDatabaseHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

