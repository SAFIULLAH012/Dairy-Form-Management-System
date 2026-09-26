/**
 * Strongly-typed API & Application Client for Dairy Farm ERP
 *
 * Supports Dual Architecture:
 * 1. Android Native Offline Mode: Calls pure domain services in-process backed by local SQLite.
 *    Does NOT require Node.js or Express.
 * 2. Web Client-Server Mode: Calls Express /api/... endpoints with automatic offline fallback.
 */

import { Capacitor } from '@capacitor/core';
import { getPlatformAdapters } from '../infrastructure/platform/index.ts';
import { LocalAppService } from '../domain/services/LocalAppService.ts';

let localAppInstance: LocalAppService | null = null;

function getLocalApp(): LocalAppService {
  if (!localAppInstance) {
    const adapters = getPlatformAdapters();
    localAppInstance = new LocalAppService(adapters.db, adapters.storage);
  }
  return localAppInstance;
}

const isNative = Capacitor.isNativePlatform();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  isNativePlatform: () => isNative,
  getPlatformInfo: () => getPlatformAdapters(),

  // --- ANIMALS ---
  async getAnimals(params?: { sex?: 'Female' | 'Male'; status?: string; group?: string }) {
    if (isNative) return getLocalApp().getAnimals(params);
    try {
      const query = new URLSearchParams(params as any).toString();
      return await fetchJson<any[]>(`/api/animals${query ? `?${query}` : ''}`);
    } catch {
      return getLocalApp().getAnimals(params);
    }
  },

  async getAnimal(id: string) {
    if (isNative) return getLocalApp().getAnimal(id);
    try {
      return await fetchJson<any>(`/api/animals/${encodeURIComponent(id)}`);
    } catch {
      return getLocalApp().getAnimal(id);
    }
  },

  async createAnimal(data: any) {
    if (isNative) return getLocalApp().createAnimal(data);
    try {
      return await fetchJson<any>('/api/animals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createAnimal(data);
    }
  },

  async updateAnimal(id: string, data: any) {
    if (isNative) return getLocalApp().updateAnimal(id, data);
    try {
      return await fetchJson<any>(`/api/animals/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().updateAnimal(id, data);
    }
  },

  async markSold(id: string, data: { saleDate: string; buyer: string; salePrice: number; notes?: string }) {
    if (isNative) return getLocalApp().markSold(id, data);
    try {
      return await fetchJson<any>(`/api/animals/${encodeURIComponent(id)}/sold`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().markSold(id, data);
    }
  },

  async markDeceased(id: string, data: { deathDate: string; deathReason: string; notes?: string }) {
    if (isNative) return getLocalApp().markDeceased(id, data);
    try {
      return await fetchJson<any>(`/api/animals/${encodeURIComponent(id)}/deceased`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().markDeceased(id, data);
    }
  },

  async getTimeline(id: string) {
    if (isNative) return getLocalApp().getTimeline(id);
    try {
      return await fetchJson<any[]>(`/api/animals/${encodeURIComponent(id)}/timeline`);
    } catch {
      return getLocalApp().getTimeline(id);
    }
  },

  async bulkUpdateGroup(animalIds: string[], newGroup: string, reason?: string) {
    if (isNative) return getLocalApp().bulkUpdateGroup(animalIds, newGroup, reason);
    try {
      return await fetchJson<any>('/api/animals/bulk/group', {
        method: 'POST',
        body: JSON.stringify({ animalIds, newGroup, reason }),
      });
    } catch {
      return getLocalApp().bulkUpdateGroup(animalIds, newGroup, reason);
    }
  },

  // --- MILK ---
  async getMilkShifts() {
    if (isNative) return getLocalApp().getMilkShifts();
    try {
      return await fetchJson<any[]>('/api/milk/shifts');
    } catch {
      return getLocalApp().getMilkShifts();
    }
  },

  async getMilkTotals(fromDate?: string, toDate?: string) {
    if (isNative) return getLocalApp().getMilkTotals(fromDate, toDate);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      return await fetchJson<any[]>(`/api/milk/total${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getMilkTotals(fromDate, toDate);
    }
  },

  async saveMilkTotal(data: any) {
    if (isNative) return getLocalApp().saveMilkTotal(data);
    try {
      return await fetchJson<any>('/api/milk/total', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().saveMilkTotal(data);
    }
  },

  async unlockMilkShift(date: string, shift: string, reason: string) {
    if (isNative) return getLocalApp().unlockMilkShift(date, shift, reason);
    try {
      return await fetchJson<any>('/api/milk/unlock', {
        method: 'POST',
        body: JSON.stringify({ date, shift, reason }),
      });
    } catch {
      return getLocalApp().unlockMilkShift(date, shift, reason);
    }
  },

  async getMilkIndividual(date: string, shift: string) {
    if (isNative) return getLocalApp().getMilkIndividual(date, shift);
    try {
      return await fetchJson<any[]>(`/api/milk/individual?date=${date}&shift=${shift}`);
    } catch {
      return getLocalApp().getMilkIndividual(date, shift);
    }
  },

  async saveMilkIndividual(date: string, shift: string, entries: any[]) {
    if (isNative) return getLocalApp().saveMilkIndividual(date, shift, entries);
    try {
      return await fetchJson<any>('/api/milk/individual', {
        method: 'POST',
        body: JSON.stringify({ date, shift, entries }),
      });
    } catch {
      return getLocalApp().saveMilkIndividual(date, shift, entries);
    }
  },

  async getAnimalMilkHistory(animalId: string) {
    if (isNative) return getLocalApp().getAnimalMilkHistory(animalId);
    try {
      return await fetchJson<any[]>(`/api/milk/history/${encodeURIComponent(animalId)}`);
    } catch {
      return getLocalApp().getAnimalMilkHistory(animalId);
    }
  },

  async recordMilkCorrection(data: any) {
    if (isNative) return getLocalApp().milkRepo.recordCorrection(data);
    try {
      return await fetchJson<any>('/api/milk/corrections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().milkRepo.recordCorrection(data);
    }
  },

  async getMilkCorrections(date?: string, shift?: string) {
    if (isNative) return getLocalApp().milkRepo.listCorrections(date, shift);
    try {
      const q = new URLSearchParams();
      if (date) q.set('date', date);
      if (shift) q.set('shift', shift);
      return await fetchJson<any[]>(`/api/milk/corrections${q.toString() ? `?${q.toString()}` : ''}`);
    } catch {
      return getLocalApp().milkRepo.listCorrections(date, shift);
    }
  },

  // --- FEED & INVENTORY ---
  async getFeedTransactions(fromDate?: string, toDate?: string, group?: string) {
    if (isNative) return getLocalApp().getFeedTransactions(fromDate, toDate, group);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      if (group) query.set('group', group);
      return await fetchJson<any[]>(`/api/feed/transactions${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getFeedTransactions(fromDate, toDate, group);
    }
  },

  async recordFeed(data: any) {
    if (isNative) return getLocalApp().recordFeed(data);
    try {
      return await fetchJson<any>('/api/feed/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordFeed(data);
    }
  },

  async getInventoryItems() {
    if (isNative) return getLocalApp().getInventoryItems();
    try {
      return await fetchJson<any[]>('/api/inventory/items');
    } catch {
      return getLocalApp().getInventoryItems();
    }
  },

  async recordStockMovement(data: any) {
    if (isNative) return getLocalApp().recordStockMovement(data);
    try {
      return await fetchJson<any>('/api/inventory/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordStockMovement(data);
    }
  },

  async getInventoryTransactions(itemId?: string) {
    if (isNative) return getLocalApp().getInventoryTransactions(itemId);
    try {
      return await fetchJson<any[]>(`/api/inventory/transactions${itemId ? `?itemId=${itemId}` : ''}`);
    } catch {
      return getLocalApp().getInventoryTransactions(itemId);
    }
  },

  // --- HEALTH & VACCINATION ---
  async getHealthCases(animalId?: string, status?: string) {
    if (isNative) return getLocalApp().getHealthCases(animalId, status);
    try {
      const query = new URLSearchParams();
      if (animalId) query.set('animalId', animalId);
      if (status) query.set('status', status);
      return await fetchJson<any[]>(`/api/health/cases${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getHealthCases(animalId, status);
    }
  },

  async createHealthCase(data: any) {
    if (isNative) return getLocalApp().createHealthCase(data);
    try {
      return await fetchJson<any>('/api/health/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createHealthCase(data);
    }
  },

  async updateHealthCase(id: string, data: any) {
    if (isNative) return getLocalApp().updateHealthCase(id, data);
    try {
      return await fetchJson<any>(`/api/health/cases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().updateHealthCase(id, data);
    }
  },

  async getVaccinations(animalId?: string) {
    if (isNative) return getLocalApp().getVaccinations(animalId);
    try {
      return await fetchJson<any[]>(`/api/vaccinations${animalId ? `?animalId=${animalId}` : ''}`);
    } catch {
      return getLocalApp().getVaccinations(animalId);
    }
  },

  async recordVaccination(data: any) {
    if (isNative) return getLocalApp().recordVaccination(data);
    try {
      return await fetchJson<any>('/api/vaccinations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordVaccination(data);
    }
  },

  // --- BREEDING & CALVING ---
  async getBreedingRecords(animalId?: string) {
    if (isNative) return getLocalApp().getBreedingRecords(animalId);
    try {
      return await fetchJson<any[]>(`/api/breeding/records${animalId ? `?animalId=${animalId}` : ''}`);
    } catch {
      return getLocalApp().getBreedingRecords(animalId);
    }
  },

  async recordBreedingEvent(data: any) {
    if (isNative) return getLocalApp().recordBreedingEvent(data);
    try {
      return await fetchJson<any>('/api/breeding/records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordBreedingEvent(data);
    }
  },

  async recordCalving(data: any) {
    if (isNative) return getLocalApp().recordCalving(data);
    try {
      return await fetchJson<any>('/api/breeding/calving', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordCalving(data);
    }
  },

  async getGrowth(animalId: string) {
    if (isNative) return getLocalApp().getGrowth(animalId);
    try {
      return await fetchJson<any[]>(`/api/growth/${encodeURIComponent(animalId)}`);
    } catch {
      return getLocalApp().getGrowth(animalId);
    }
  },

  async recordGrowth(animalId: string, data: any) {
    if (isNative) return getLocalApp().recordGrowth(animalId, data);
    try {
      return await fetchJson<any>(`/api/growth/${encodeURIComponent(animalId)}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordGrowth(animalId, data);
    }
  },

  // --- CUSTOMERS & INVOICES ---
  async getCustomers() {
    if (isNative) return getLocalApp().getCustomers();
    try {
      return await fetchJson<any[]>('/api/customers');
    } catch {
      return getLocalApp().getCustomers();
    }
  },

  async createCustomer(data: any) {
    if (isNative) return getLocalApp().createCustomer(data);
    try {
      return await fetchJson<any>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createCustomer(data);
    }
  },

  async getDeliveries(fromDate?: string, toDate?: string, customerId?: string) {
    if (isNative) return getLocalApp().getDeliveries(fromDate, toDate, customerId);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      if (customerId) query.set('customerId', customerId);
      return await fetchJson<any[]>(`/api/deliveries${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getDeliveries(fromDate, toDate, customerId);
    }
  },

  async createDelivery(data: any) {
    if (isNative) return getLocalApp().createDelivery(data);
    try {
      return await fetchJson<any>('/api/deliveries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createDelivery(data);
    }
  },

  async recordPayment(deliveryId: string, data: any) {
    if (isNative) return getLocalApp().recordPayment(deliveryId, data);
    try {
      return await fetchJson<any>(`/api/deliveries/${encodeURIComponent(deliveryId)}/pay`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordPayment(deliveryId, data);
    }
  },

  async getPayments() {
    if (isNative) return getLocalApp().getPayments();
    try {
      return await fetchJson<any[]>('/api/payments');
    } catch {
      return getLocalApp().getPayments();
    }
  },

  // --- WORKERS & EXPENSES ---
  async getWorkers() {
    if (isNative) return getLocalApp().getWorkers();
    try {
      return await fetchJson<any[]>('/api/workers');
    } catch {
      return getLocalApp().getWorkers();
    }
  },

  async createWorker(data: any) {
    if (isNative) return getLocalApp().createWorker(data);
    try {
      return await fetchJson<any>('/api/workers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createWorker(data);
    }
  },

  async getWorkerLedger(workerId: string) {
    if (isNative) return getLocalApp().getWorkerLedger(workerId);
    try {
      return await fetchJson<any>(`/api/workers/${encodeURIComponent(workerId)}/ledger`);
    } catch {
      return getLocalApp().getWorkerLedger(workerId);
    }
  },

  async recordWorkerTx(workerId: string, data: any) {
    if (isNative) return getLocalApp().recordWorkerTx(workerId, data);
    try {
      return await fetchJson<any>(`/api/workers/${encodeURIComponent(workerId)}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordWorkerTx(workerId, data);
    }
  },

  async getExpenses(fromDate?: string, toDate?: string, category?: string) {
    if (isNative) return getLocalApp().getExpenses(fromDate, toDate, category);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      if (category) query.set('category', category);
      return await fetchJson<any[]>(`/api/expenses${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getExpenses(fromDate, toDate, category);
    }
  },

  async recordExpense(data: any) {
    if (isNative) return getLocalApp().recordExpense(data);
    try {
      return await fetchJson<any>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().recordExpense(data);
    }
  },

  // --- REMINDERS & NOTIFICATIONS ---
  async getTasks(status?: string) {
    if (isNative) return getLocalApp().getTasks(status);
    try {
      return await fetchJson<any[]>(`/api/reminders${status ? `?status=${status}` : ''}`);
    } catch {
      return getLocalApp().getTasks(status);
    }
  },

  async createTask(data: any) {
    if (isNative) return getLocalApp().createTask(data);
    try {
      return await fetchJson<any>('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().createTask(data);
    }
  },

  async completeTask(id: string) {
    if (isNative) return getLocalApp().completeTask(id);
    try {
      return await fetchJson<any>(`/api/reminders/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
      });
    } catch {
      return getLocalApp().completeTask(id);
    }
  },

  async deleteTask(id: string) {
    if (isNative) return getLocalApp().deleteTask(id);
    try {
      return await fetchJson<any>(`/api/reminders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      return getLocalApp().deleteTask(id);
    }
  },

  async getNotificationsSummary() {
    if (isNative) return getLocalApp().getNotificationsSummary();
    try {
      return await fetchJson<any>('/api/reminders/notifications');
    } catch {
      return getLocalApp().getNotificationsSummary();
    }
  },

  // --- REPORTS ---
  async getFinancialReport(fromDate?: string, toDate?: string) {
    if (isNative) return getLocalApp().getFinancialReport(fromDate, toDate);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      return await fetchJson<any>(`/api/reports/financial${query.toString() ? `?${query.toString()}` : ''}`);
    } catch {
      return getLocalApp().getFinancialReport(fromDate, toDate);
    }
  },

  async getHerdStatistics() {
    if (isNative) return getLocalApp().getHerdStatistics();
    try {
      return await fetchJson<any>('/api/reports/herd');
    } catch {
      return getLocalApp().getHerdStatistics();
    }
  },

  // --- SETTINGS, HEALTH & BACKUP ---
  async getSettings() {
    if (isNative) return getLocalApp().getSettings();
    try {
      return await fetchJson<any>('/api/settings');
    } catch {
      return getLocalApp().getSettings();
    }
  },

  async saveSettings(data: any) {
    if (isNative) return getLocalApp().saveSettings(data);
    try {
      return await fetchJson<any>('/api/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().saveSettings(data);
    }
  },

  async getGroups() {
    if (isNative) return getLocalApp().getGroups();
    try {
      return await fetchJson<string[]>('/api/settings/groups');
    } catch {
      return getLocalApp().getGroups();
    }
  },

  async saveGroups(groups: string[]) {
    if (isNative) return getLocalApp().saveGroups(groups);
    try {
      return await fetchJson<any>('/api/settings/groups', {
        method: 'POST',
        body: JSON.stringify({ groups }),
      });
    } catch {
      return getLocalApp().saveGroups(groups);
    }
  },

  async getDatabaseHealth() {
    if (isNative) return getLocalApp().getDatabaseHealth();
    try {
      return await fetchJson<any>('/api/settings/health');
    } catch {
      return getLocalApp().getDatabaseHealth();
    }
  },

  async getAuditLogs() {
    if (isNative) return getLocalApp().getAuditLogs();
    try {
      return await fetchJson<any[]>('/api/audit');
    } catch {
      return getLocalApp().getAuditLogs();
    }
  },

  async validateBackup(content: any) {
    if (isNative) return getLocalApp().validateBackup(content);
    try {
      return await fetchJson<any>('/api/backup/validate', {
        method: 'POST',
        body: JSON.stringify(content),
      });
    } catch {
      return getLocalApp().validateBackup(content);
    }
  },

  // --- CSV IMPORT / EXPORT ---
  async previewCsv(module: 'ANIMALS' | 'MILK' | 'CUSTOMERS', text: string) {
    if (isNative) return getLocalApp().previewCsv(module, text);
    try {
      return await fetchJson<any>('/api/csv/preview', {
        method: 'POST',
        body: JSON.stringify({ module, text }),
      });
    } catch {
      return getLocalApp().previewCsv(module, text);
    }
  },

  async executeCsvImport(preview: any) {
    if (isNative) return getLocalApp().executeCsvImport(preview);
    try {
      return await fetchJson<any>('/api/csv/import', {
        method: 'POST',
        body: JSON.stringify({ preview }),
      });
    } catch {
      return getLocalApp().executeCsvImport(preview);
    }
  },

  // --- ATTACHMENTS & MEDIA ---
  async saveAttachment(meta: {
    entityType: 'ANIMAL' | 'HEALTH' | 'VACCINE' | 'EXPENSE' | 'INVOICE' | 'OTHER';
    entityId: string;
    fileName: string;
    mimeType: string;
    fileData: Uint8Array | string;
  }) {
    return getLocalApp().saveAttachment(meta);
  },

  async getAttachments(entityType: string, entityId: string) {
    return getLocalApp().getAttachments(entityType, entityId);
  },

  async deleteAttachment(id: string) {
    return getLocalApp().deleteAttachment(id);
  },

  // Platform hardware helpers
  async capturePhoto(): Promise<string | null> {
    return getPlatformAdapters().camera.capturePhoto();
  },

  async pickFromGallery(): Promise<string | null> {
    return getPlatformAdapters().camera.pickFromGallery();
  },

  async shareText(title: string, text: string) {
    return getPlatformAdapters().share.shareText(title, text);
  },
};
