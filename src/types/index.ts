// Wonderland Arcade Management System Types

export type StaffRole = 'owner' | 'receptionist';

export interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
  timezone: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  locationId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  phone: string;
  pin?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  locationId: string;
  name: string;
  phone: string; // Normalized 10-digit Indian phone number
  notes?: string;
  totalVisits: number;
  createdAt: string;
  lastVisitAt?: string;
}

export interface Visit {
  id: string;
  locationId: string;
  customerId: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdBy: string;
}

export interface GameCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
}

export type PricingType = 'TIME_BASED' | 'UNIT_BASED' | 'PER_OVER' | 'DAY_PASS';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  pricingType: PricingType;
  defaultPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  durationMinutes?: number;
  playerCount: number;
  price: number;
  isActive: boolean;
}

export type ResourceStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE';

export interface Resource {
  id: string;
  locationId: string;
  categoryId: string;
  name: string;
  resourceType: string;
  status: ResourceStatus;
  capacity: number; // 1 for console/table, >1 for soft play
  currentOccupancy: number;
  updatedAt: string;
}

export type SessionStatus = 'RUNNING' | 'DUE' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

export interface Session {
  id: string;
  visitId: string;
  customerId: string;
  productId: string;
  variantId?: string;
  resourceId?: string;
  startTime: string; // ISO
  durationMinutes: number;
  scheduledEndTime: string; // ISO
  gracePeriodMinutes: number; // Default 5
  graceDeadline: string; // ISO = scheduledEndTime + gracePeriod
  actualEndTime?: string; // ISO
  status: SessionStatus;
  price: number;
  staffStartId: string;
  staffEndId?: string;
  customerPackageId?: string;
  packageMinutesUsed?: number;
  createdAt: string;
}

export interface SessionExtension {
  id: string;
  sessionId: string;
  addedMinutes: number;
  extraCharge: number;
  staffId: string;
  extendedAt: string;
}

export interface PackageDefinition {
  id: string;
  name: string;
  price: number;
  allocatedMinutes: number;
  validityDays: number;
  eligibleCategoryId?: string;
  maxPlayers: number;
  isActive: boolean;
}

export type CustomerPackageStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED';

export interface CustomerPackage {
  id: string;
  customerId: string;
  packageId: string;
  allocatedMinutes: number;
  remainingMinutes: number;
  purchasedAt: string;
  expiresAt: string;
  status: CustomerPackageStatus;
  invoiceId?: string;
}

export interface PackageUsage {
  id: string;
  customerPackageId: string;
  sessionId: string;
  minutesDeducted: number;
  deductedAt: string;
  staffId: string;
}

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export interface Invoice {
  id: string;
  locationId: string;
  customerId: string;
  visitId?: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  staffId: string;
  createdAt: string;
}

export type InvoiceItemType = 'SESSION' | 'PRODUCT' | 'PACKAGE' | 'EXTENSION' | 'CUSTOM';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: InvoiceItemType;
  referenceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'UNMATCHED' | 'REFUNDED';

export interface Payment {
  id: string;
  locationId: string;
  customerId?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // UPI UTR or bank ref
  status: PaymentStatus;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  allocatedAmount: number;
  allocatedAt: string;
}

export interface NotificationItem {
  id: string;
  sessionId?: string;
  type: 'DUE' | 'OVERDUE' | 'CAPACITY_WARNING' | 'SYSTEM';
  title: string;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  channel: 'IN_APP' | 'WHATSAPP';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  staffId: string;
  staffName?: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface SystemSettings {
  defaultGracePeriodMinutes: number;
  businessOpeningTime: string; // "10:00"
  businessClosingTime: string; // "23:00"
  businessTimezone: string; // "Asia/Kolkata"
  currencySymbol: string; // "₹"
  softPlayMaxCapacity: number; // 25
  allowOverdueExtensions: boolean;
  enableSoundAlerts: boolean;
  whatsAppNotificationsEnabled: boolean;
  whatsAppApiKey?: string;
  whatsAppSenderNumber?: string;
}

export interface SystemState {
  locations: Location[];
  profiles: Profile[];
  customers: Customer[];
  visits: Visit[];
  gameCategories: GameCategory[];
  products: Product[];
  productVariants: ProductVariant[];
  resources: Resource[];
  sessions: Session[];
  sessionExtensions: SessionExtension[];
  packages: PackageDefinition[];
  customerPackages: CustomerPackage[];
  packageUsages: PackageUsage[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}
