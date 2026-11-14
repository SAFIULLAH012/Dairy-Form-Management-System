import { Router } from 'express';
import { AppContainer } from '../container.ts';
import { createHealthRoutes } from './health.routes.ts';
import { createAnimalRoutes } from './animal.routes.ts';
import { createMilkRoutes } from './milk.routes.ts';
import { createFeedRoutes } from './feed.routes.ts';
import { createInventoryRoutes } from './inventory.routes.ts';
import { createHealthCareRoutes } from './healthCare.routes.ts';
import { createBreedingRoutes } from './breeding.routes.ts';
import { createSalesRoutes } from './sales.routes.ts';
import { createWorkerRoutes } from './worker.routes.ts';
import { createFinanceRoutes } from './finance.routes.ts';
import { createReminderRoutes } from './reminder.routes.ts';
import { createReportRoutes } from './report.routes.ts';
import { createSettingsRoutes } from './settings.routes.ts';
import { createSystemRoutes } from './system.routes.ts';

export function createApiRouter(container: AppContainer): Router {
  const router = Router();

  // Mount domain and system route controllers
  router.use(createHealthRoutes());
  router.use('/animals', createAnimalRoutes(container));
  router.use('/milk', createMilkRoutes(container));
  router.use('/feed', createFeedRoutes(container));
  router.use('/inventory', createInventoryRoutes(container));
  router.use(createHealthCareRoutes(container));
  router.use(createBreedingRoutes(container));
  router.use(createSalesRoutes(container));
  router.use('/workers', createWorkerRoutes(container));
  router.use(createFinanceRoutes(container));
  router.use('/reminders', createReminderRoutes(container));
  router.use('/reports', createReportRoutes(container));
  router.use('/settings', createSettingsRoutes(container));
  router.use(createSystemRoutes(container));

  return router;
}

