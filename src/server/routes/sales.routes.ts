import { Router, Request, Response } from 'express';
import { AppContainer } from '../container.ts';

export function createSalesRoutes(container: AppContainer): Router {
  const router = Router();
  const { customer: customerRepo, delivery: deliveryRepo, payment: paymentRepo } = container.repos;
  const { salesInvoice: salesInvoiceService } = container.services;

  // Customers
  router.get('/customers', async (_req: Request, res: Response) => {
    try {
      const list = await customerRepo.listAll();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/customers', async (req: Request, res: Response) => {
    try {
      const customer = {
        ...req.body,
        id: req.body.id || `CUST_${Date.now()}`,
        createdAt: req.body.createdAt || new Date().toISOString(),
      };
      const saved = await customerRepo.save(customer);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Deliveries & Invoices
  router.get('/deliveries', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      const list = await deliveryRepo.listInvoices({ fromDate, toDate, customerId });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/deliveries', async (req: Request, res: Response) => {
    try {
      const invoice = await salesInvoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/deliveries/:id/pay', async (req: Request, res: Response) => {
    try {
      const payment = await salesInvoiceService.recordPayment({
        invoiceId: req.params.id,
        ...req.body,
      });
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Payments
  router.get('/payments', async (_req: Request, res: Response) => {
    try {
      const list = await paymentRepo.listAll();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

