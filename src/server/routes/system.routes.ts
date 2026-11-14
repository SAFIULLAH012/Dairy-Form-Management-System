import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createSystemRoutes(container: AppContainer): Router {
  const router = Router();
  const { audit: auditRepo, attachment: attachmentRepo } = container.repos;
  const { auditBackup: auditBackupService, csv: csvService } = container.services;

  // --- AUDIT ---
  router.get('/audit', async (_req: Request, res: Response) => {
    try {
      const logs = await auditRepo.listLogs(100);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- BACKUP ---
  router.get('/backup/snapshots', (_req: Request, res: Response) => {
    try {
      const snapshots = container.backupManager.listBackups();
      res.json(snapshots);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/backup/export', async (_req: Request, res: Response) => {
    try {
      const backup = await auditBackupService.generateFullBackup();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dairy_farm_backup_${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.send(JSON.stringify(backup, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/backup/validate', (req: Request, res: Response) => {
    try {
      const validation = auditBackupService.validateBackupFile(req.body);
      res.json(validation);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/backup/restore', async (req: Request, res: Response) => {
    try {
      const validation = auditBackupService.validateBackupFile(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Backup file validation failed.',
          details: validation.errors,
        });
      }
      const result = await auditBackupService.restoreFromBackup(req.body);
      res.json({
        success: true,
        message: 'Backup restored successfully.',
        restoredCounts: result.restoredCounts,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CSV IMPORT / EXPORT ---
  router.post('/csv/preview', (req: Request, res: Response) => {
    try {
      const { module, text } = req.body;
      if (module === 'ANIMALS') return res.json(csvService.previewAnimalsCsv(text));
      if (module === 'MILK') return res.json(csvService.previewMilkCsv(text));
      return res.json(csvService.previewCustomersCsv(text));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/csv/import', (req: Request, res: Response) => {
    try {
      const { preview, user } = req.body;
      const result = csvService.executeImport(preview, user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/csv/export/:module', (req: Request, res: Response) => {
    try {
      const { module } = req.params;
      let csv = '';
      if (module === 'animals') csv = csvService.exportAnimalsCsv();
      else if (module === 'milk') csv = csvService.exportMilkCsv();
      else return res.status(400).json({ error: 'Unknown export module' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${module}_export.csv"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ATTACHMENTS ---
  router.post('/attachments', async (req: Request, res: Response) => {
    try {
      const meta = await attachmentRepo.saveMetadata(req.body);
      res.json(meta);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/attachments/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const files = await attachmentRepo.getMetadata(req.params.entityType, req.params.entityId);
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/attachments/:id', async (req: Request, res: Response) => {
    try {
      await attachmentRepo.deleteMetadata(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

