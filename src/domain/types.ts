/**
 * Core Domain Types for Dairy Farm ERP
 * Platform-independent entity models and DTOs.
 */

export type Gender = 'Female' | 'Male';
export type AnimalLifeStage = 'Calf' | 'Heifer' | 'Adult' | 'Male';
export type ReproductiveStatus = 'Pregnant' | 'Milking' | 'Repeat' | 'Nil' | 'Pending' | 'Open' | 'N/A';
export type MilkStatus = 'Milking' | 'Dry' | 'Not Milking' | 'N/A';
export type AnimalRecordStatus = 'Active' | 'Sold' | 'Deceased' | 'Archived';

export interface AnimalIdentifier {
  id: string;
  animalId: string;
  type: 'COW_NUMBER' | 'TAG_1' | 'TAG_2' | 'OTHER';
  value: string;
}

export interface Animal {
  id: string; // Internal unique ID (e.g., C-001)
  cowNumber?: string;
  tag1?: string;
  tag2?: string;
  sex: Gender;
  dob: string; // YYYY-MM-DD (Authoritative for age calculation)
  breed: string;
  group: string; // 'High', 'Low', custom group
  stage: AnimalLifeStage;
  reproStatus: ReproductiveStatus;
  milkStatus: MilkStatus;
  status: AnimalRecordStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  notes?: string;
  photoUrl?: string; // Local attachment reference / base64
  damId?: string; // Mother ID
  sireId?: string; // Father ID
  birthWeight?: number; // kg
  weaningDate?: string;
  saleDate?: string;
  salePrice?: number;
  buyer?: string;
  deathDate?: string;
  deathReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  animalId: string;
  changeType: 'STAGE' | 'REPRODUCTIVE' | 'MILK' | 'GROUP' | 'STATUS';
  oldValue: string;
  newValue: string;
  date: string;
  reason?: string;
  user: string;
  createdAt: string;
}

export interface MilkShiftConfig {
  id: string;
  name: string; // 'Morning', 'Afternoon', 'Evening', custom
  startTime: string; // HH:mm
  endTime: string;
  active: boolean;
  reminderMinutes: number;
}

export interface MilkTotalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  shift: string; // Morning, Afternoon, Evening
  totalLitres: number;
  fatPercent?: number;
  snfPercent?: number;
  mode: 'total' | 'individual';
  locked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MilkZeroReason =
  | 'Normal'
  | 'Sick'
  | 'Dry'
  | 'Pregnant / dry period'
  | 'No milk today'
  | 'Not present'
  | 'Other';

export interface MilkIndividualEntry {
  id: string;
  date: string;
  shift: string;
  animalId: string;
  litres: number;
  fatPercent?: number;
  snfPercent?: number;
  reason: MilkZeroReason;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedType {
  id: string;
  name: string; // Silage, Green Fodder, Wanda, Cotton Seed Cake, etc.
  description?: string;
  defaultPricePerKg?: number;
}

export interface FeedTransaction {
  id: string;
  date: string;
  group: string;
  feedType: string;
  maund: number;
  kg: number; // Normalized (1 Maund = 40 KG)
  pricePerKg: number;
  totalCost: number; // kg * pricePerKg
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'FEED' | 'MEDICINE' | 'VACCINE' | 'SUPPLY' | 'OTHER';
  currentStock: number;
  unit: 'KG' | 'MAUND' | 'VIAL' | 'LITRE' | 'DOSE' | 'ITEM';
  minStockThreshold: number;
  avgDailyConsumption?: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'WASTAGE';
  quantity: number;
  signedQuantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type HealthStatus = 'Open' | 'Under Treatment' | 'Follow-up' | 'Recovered' | 'Closed';

export interface HealthCase {
  id: string;
  animalId: string;
  date: string;
  problem: string;
  symptoms?: string;
  diagnosis?: string;
  medicine?: string;
  dose?: string;
  injection?: string;
  provider?: string;
  cost?: number;
  status: HealthStatus;
  followUpDate?: string;
  recoveryDate?: string;
  notes?: string;
  source: 'MANUAL' | 'MILK_ENTRY';
  createdAt: string;
  updatedAt: string;
}

export type VaccinationStatus = 'Completed' | 'Due Soon' | 'Due Today' | 'Overdue';

export interface VaccinationRecord {
  id: string;
  animalId: string;
  vaccineType: 'FMD' | 'HS' | 'BQ' | 'Deworming' | string;
  lastDate: string;
  nextDueDate: string;
  product?: string;
  dose?: string;
  provider?: string;
  cost?: number;
  status: VaccinationStatus;
  notes?: string;
  createdAt: string;
}

export type BreedingEventType =
  | 'Heat'
  | 'Insemination'
  | 'Pregnancy Check'
  | 'Pregnant'
  | 'Not Pregnant'
  | 'Calving'
  | 'Repeat'
  | 'Nil'
  | 'Dry-off'
  | 'Other';

export interface BreedingRecord {
  id: string;
  animalId: string;
  date: string;
  event: BreedingEventType;
  sireBreedOrId?: string;
  inseminatorName?: string;
  expectedCalvingDate?: string; // Insemination + 283 days
  recommendedDryOffDate?: string; // Expected Calving - 60 days
  expectedNextHeatDate?: string; // Last Heat + ~21 days
  actualCalvingDate?: string;
  followUpDate?: string;
  status: 'Recorded' | 'Pending' | 'Completed';
  notes?: string;
  createdAt: string;
}

export interface GrowthMeasurement {
  id: string;
  animalId: string;
  date: string;
  weightKg: number;
  ageDaysAtWeighing: number;
  averageDailyGain?: number; // kg/day since previous weighing
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  defaultRatePerL: number;
  paymentTermsDays: number;
  notes?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type InvoiceStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface DeliveryInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  receiverName?: string;
  date: string;
  time: string;
  litres: number;
  fatPercent?: number;
  snfPercent?: number;
  ratePerL: number;
  totalAmount: number;
  paymentTerms: string;
  dueDate: string;
  paidAmount: number;
  remainingBalance: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  customerId: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  role: string;
  joiningDate: string;
  monthlySalary: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface WorkerTransaction {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  type: 'Advance' | 'Salary Payment' | 'Deduction' | 'Bonus';
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category:
    | 'Feed'
    | 'Medicine'
    | 'Labour'
    | 'Electricity'
    | 'Transport'
    | 'Repairs'
    | 'Animal Purchase'
    | 'Maintenance'
    | 'Other';
  amount: number;
  vendor?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Other';
  reference?: string;
  notes?: string;
  attachmentId?: string;
  createdAt: string;
}

export type TaskStatus = 'Scheduled' | 'Due' | 'Overdue' | 'Completed' | 'Cancelled';
export type TaskModule =
  | 'milk'
  | 'feed'
  | 'inventory'
  | 'health'
  | 'vaccination'
  | 'breeding'
  | 'deliveries'
  | 'customers'
  | 'workers'
  | 'expenses'
  | 'tasks';

export interface FarmTaskReminder {
  id: string;
  title: string;
  sourceModule: TaskModule;
  dueDate: string;
  dueTime: string;
  status: TaskStatus;
  linkedRecordId?: string;
  autoKey?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface FarmSettings {
  id: string;
  farmName: string;
  farmAddress: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  weightUnit: string;
  milkUnit: string;
  feedUnit: string;
  timezone: string;
  defaultPaymentTermsDays: number;
  defaultMilkShifts: string[];
  reminderMinutes: number;
  lowStockHorizonDays: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'CORRECTION' | 'RESTORE' | 'BULK_UPDATE';
  module: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  user: string;
}

export interface AttachmentMetadata {
  id: string;
  entityType: 'ANIMAL' | 'HEALTH' | 'VACCINE' | 'EXPENSE' | 'INVOICE' | 'OTHER';
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localPath: string; // or base64 storage key
  checksum?: string;
  createdAt: string;
}

export interface MilkCorrectionRecord {
  id: string;
  date: string;
  shift: string;
  animalId?: string;
  originalLitres?: number;
  correctedLitres?: number;
  originalFat?: number;
  correctedFat?: number;
  originalSnf?: number;
  correctedSnf?: number;
  reason: string;
  userName: string;
  timestamp: string;
}

export interface CsvImportLog {
  id: string;
  module: string;
  filename: string;
  rowsImported: number;
  rowsSkipped: number;
  importedBy: string;
  timestamp: string;
}

