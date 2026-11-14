/**
 * Strongly-typed API & Application Client for Dairy Farm ERP
 *
 * Windows Desktop / Laptop (Electron) & Web Architecture:
 * Communicates with the local Express / SQLite backend with seamless
 * in-browser offline fallback support.
 */

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

const isNative = false;

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
    try {
      const query = new URLSearchParams();
      if (params?.sex) query.set('sex', params.sex);
      if (params?.status) query.set('status', params.status);
      if (params?.group) query.set('group', params.group);
      const qs = query.toString();
      return await fetchJson<any[]>(`/api/animals${qs ? `?${qs}` : ''}`);
    } catch {
      return getLocalApp().getAnimals(params);
    }
  },

  async getAnimal(id: string) {
    try {
      return await fetchJson<any>(`/api/animals/${encodeURIComponent(id)}`);
    } catch {
      return getLocalApp().getAnimal(id);
    }
  },

  async createAnimal(data: any) {
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
    try {
      return await fetchJson<any[]>(`/api/animals/${encodeURIComponent(id)}/timeline`);
    } catch {
      return getLocalApp().getTimeline(id);
    }
  },

  async bulkUpdateGroup(animalIds: string[], newGroup: string, reason?: string) {
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
    try {
      return await fetchJson<any[]>('/api/milk/shifts');
    } catch {
      return getLocalApp().getMilkShifts();
    }
  },

  async getMilkTotals(fromDate?: string, toDate?: string) {
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
    try {
      return await fetchJson<any[]>(`/api/milk/individual?date=${date}&shift=${shift}`);
    } catch {
      return getLocalApp().getMilkIndividual(date, shift);
    }
  },

  async saveMilkIndividual(date: string, shift: string, entries: any[]) {
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
    try {
      return await fetchJson<any[]>(`/api/milk/history/${encodeURIComponent(animalId)}`);
    } catch {
      return getLocalApp().getAnimalMilkHistory(animalId);
    }
  },

  async recordMilkCorrection(data: any) {
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
    try {
      return await fetchJson<any[]>('/api/inventory/items');
    } catch {
      return getLocalApp().getInventoryItems();
    }
  },

  async createInventoryItem(data: any) {
    try {
      return await fetchJson<any>('/api/inventory/items', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return getLocalApp().saveInventoryItem(data);
    }
  },

  async recordStockMovement(data: any) {
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
    try {
      return await fetchJson<any[]>(`/api/inventory/transactions${itemId ? `?itemId=${itemId}` : ''}`);
    } catch {
      return getLocalApp().getInventoryTransactions(itemId);
    }
  },

  // --- HEALTH & VACCINATION ---
  async getHealthCases(animalId?: string, status?: string) {
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
    try {
      return await fetchJson<any[]>(`/api/vaccinations${animalId ? `?animalId=${animalId}` : ''}`);
    } catch {
      return getLocalApp().getVaccinations(animalId);
    }
  },

  async recordVaccination(data: any) {
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
    try {
      return await fetchJson<any[]>(`/api/breeding/records${animalId ? `?animalId=${animalId}` : ''}`);
    } catch {
      return getLocalApp().getBreedingRecords(animalId);
    }
  },

  async recordBreedingEvent(data: any) {
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
    try {
      return await fetchJson<any[]>(`/api/growth/${encodeURIComponent(animalId)}`);
    } catch {
      return getLocalApp().getGrowth(animalId);
    }
  },

  async recordGrowth(animalId: string, data: any) {
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
    try {
      return await fetchJson<any[]>('/api/customers');
    } catch {
      return getLocalApp().getCustomers();
    }
  },

  async createCustomer(data: any) {
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
    try {
      return await fetchJson<any[]>('/api/payments');
    } catch {
      return getLocalApp().getPayments();
    }
  },

  // --- WORKERS & EXPENSES ---
  async getWorkers() {
    try {
      return await fetchJson<any[]>('/api/workers');
    } catch {
      return getLocalApp().getWorkers();
    }
  },

  async createWorker(data: any) {
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
    try {
      return await fetchJson<any>(`/api/workers/${encodeURIComponent(workerId)}/ledger`);
    } catch {
      return getLocalApp().getWorkerLedger(workerId);
    }
  },

  async recordWorkerTx(workerId: string, data: any) {
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
    try {
      return await fetchJson<any[]>(`/api/reminders${status ? `?status=${status}` : ''}`);
    } catch {
      return getLocalApp().getTasks(status);
    }
  },

  async createTask(data: any) {
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
    try {
      return await fetchJson<any>(`/api/reminders/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
      });
    } catch {
      return getLocalApp().completeTask(id);
    }
  },

  async deleteTask(id: string) {
    try {
      return await fetchJson<any>(`/api/reminders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      return getLocalApp().deleteTask(id);
    }
  },

  async getNotificationsSummary() {
    try {
      return await fetchJson<any>('/api/reminders/notifications');
    } catch {
      return getLocalApp().getNotificationsSummary();
    }
  },

  // --- REPORTS ---
  async getFinancialReport(fromDate?: string, toDate?: string) {
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
    try {
      return await fetchJson<any>('/api/reports/herd');
    } catch {
      return getLocalApp().getHerdStatistics();
    }
  },

  // --- SETTINGS, HEALTH & BACKUP ---
  async getSettings() {
    try {
      return await fetchJson<any>('/api/settings');
    } catch {
      return getLocalApp().getSettings();
    }
  },

  async saveSettings(data: any) {
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
    try {
      return await fetchJson<string[]>('/api/settings/groups');
    } catch {
      return getLocalApp().getGroups();
    }
  },

  async saveGroups(groups: string[]) {
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
    try {
      return await fetchJson<any>('/api/settings/health');
    } catch {
      return getLocalApp().getDatabaseHealth();
    }
  },

  async getAuditLogs() {
    try {
      return await fetchJson<any[]>('/api/audit');
    } catch {
      return getLocalApp().getAuditLogs();
    }
  },

  async validateBackup(content: any) {
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
