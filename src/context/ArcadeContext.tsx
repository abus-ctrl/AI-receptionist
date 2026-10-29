import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AuditLog,
  Customer,
  CustomerPackage,
  Invoice,
  InvoiceItem,
  NotificationItem,
  PackageDefinition,
  PackageUsage,
  Payment,
  PaymentAllocation,
  Product,
  ProductVariant,
  Resource,
  Session,
  SessionExtension,
  SystemSettings,
  SystemState,
  Visit
} from '../types';
import { storageEngine } from '../lib/storage';
import { normalizeIndianPhone } from '../lib/phoneUtils';
import { soundAlert } from '../lib/audioAlert';
import { useAuth } from './AuthContext';
import { apiClient } from '../lib/apiClient';

interface StartSessionParams {
  customerId: string;
  productId: string;
  variantId?: string;
  resourceId?: string;
  durationMinutes: number;
  price: number;
  customerPackageId?: string;
  notes?: string;
}

interface CreateInvoiceParams {
  customerId: string;
  visitId?: string;
  items: Array<{
    itemType: 'SESSION' | 'PRODUCT' | 'PACKAGE' | 'EXTENSION' | 'CUSTOM';
    referenceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: number;
  tax?: number;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  paymentReference?: string;
  paidAmount?: number;
}

interface ArcadeContextType {
  state: SystemState;
  findOrCreateCustomer: (name: string, phone: string, notes?: string) => Customer;
  searchCustomers: (query: string) => Customer[];
  startSession: (params: StartSessionParams) => { success: boolean; session?: Session; error?: string };
  extendSession: (sessionId: string, addedMinutes: number, extraCharge: number) => { success: boolean; error?: string };
  endSession: (sessionId: string) => { success: boolean; error?: string };
  cancelSession: (sessionId: string, reason: string) => { success: boolean; error?: string };
  createInvoice: (params: CreateInvoiceParams) => { success: boolean; invoice?: Invoice; error?: string };
  recordPayment: (params: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
    referenceNumber?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
  reconcilePayment: (paymentId: string, status: 'CONFIRMED' | 'UNMATCHED' | 'REFUNDED', targetInvoiceId?: string) => void;
  purchasePackage: (customerId: string, packageId: string, paymentMethod: 'CASH' | 'UPI' | 'CARD') => { success: boolean; customerPackage?: CustomerPackage; error?: string };
  updateResourceStatus: (resourceId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE', capacity?: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  updateProductVariantPrice: (variantId: string, newPrice: number) => void;
  acknowledgeNotification: (notificationId: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetAllData: () => void;
  importWorkbookData: (newInvoices: Invoice[], newCustomers: Customer[]) => void;
}

const ArcadeContext = createContext<ArcadeContextType | undefined>(undefined);

export const ArcadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<SystemState>(() => storageEngine.getState());
  const alertedDueSessions = useRef<Set<string>>(new Set());
  const alertedOverdueSessions = useRef<Set<string>>(new Set());

  // Subscribe to storage updates for multi-tab sync
  useEffect(() => {
    return storageEngine.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  const persistState = useCallback((updater: (prev: SystemState) => SystemState) => {
    setState((prev) => {
      const next = updater(prev);
      storageEngine.saveState(next);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Real-Time Timer Engine (Authoritative timestamp calculation loop)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = Date.now();
      let stateChanged = false;

      setState((currentState) => {
        let updatedSessions = [...currentState.sessions];
        let updatedNotifications = [...currentState.notifications];

        updatedSessions = updatedSessions.map((session) => {
          if (session.status !== 'RUNNING' && session.status !== 'DUE') {
            return session;
          }

          const schedEnd = new Date(session.scheduledEndTime).getTime();
          const graceEnd = new Date(session.graceDeadline).getTime();

          // Transition to DUE when duration runs out
          if (now >= schedEnd && now < graceEnd && session.status === 'RUNNING') {
            stateChanged = true;
            if (!alertedDueSessions.current.has(session.id)) {
              alertedDueSessions.current.add(session.id);
              if (currentState.settings.enableSoundAlerts) {
                soundAlert.playDueChime();
              }
              const customer = currentState.customers.find((c) => c.id === session.customerId);
              const resource = currentState.resources.find((r) => r.id === session.resourceId);
              const notif: NotificationItem = {
                id: `notif-${Date.now()}-${session.id.slice(-4)}`,
                sessionId: session.id,
                type: 'DUE',
                title: 'Session Duration Ended (Due)',
                message: `${customer?.name || 'Customer'} on ${resource?.name || 'Game'} has finished scheduled time. Inform customer for extension or logout.`,
                isAcknowledged: false,
                channel: 'IN_APP',
                createdAt: new Date().toISOString()
              };
              updatedNotifications = [notif, ...updatedNotifications];
            }
            return { ...session, status: 'DUE' as const };
          }

          // Transition to OVERDUE when 5-min grace period expires
          if (now >= graceEnd) {
            stateChanged = true;
            if (!alertedOverdueSessions.current.has(session.id)) {
              alertedOverdueSessions.current.add(session.id);
              if (currentState.settings.enableSoundAlerts) {
                soundAlert.playOverdueAlert();
              }
              const customer = currentState.customers.find((c) => c.id === session.customerId);
              const resource = currentState.resources.find((r) => r.id === session.resourceId);
              const notif: NotificationItem = {
                id: `notif-${Date.now()}-${session.id.slice(-4)}`,
                sessionId: session.id,
                type: 'OVERDUE',
                title: 'Grace Period Expired (Overdue)',
                message: `${customer?.name || 'Customer'} on ${resource?.name || 'Game'} is now OVERDUE. Immediate desk intervention required.`,
                isAcknowledged: false,
                channel: 'IN_APP',
                createdAt: new Date().toISOString()
              };
              updatedNotifications = [notif, ...updatedNotifications];
            }
            return { ...session, status: 'OVERDUE' as const };
          }

          return session;
        });

        if (stateChanged) {
          const nextState = {
            ...currentState,
            sessions: updatedSessions,
            notifications: updatedNotifications
          };
          storageEngine.saveState(nextState);
          return nextState;
        }

        return currentState;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // ---------------------------------------------------------------------------
  // Customer Management
  // ---------------------------------------------------------------------------
  const findOrCreateCustomer = useCallback(
    (name: string, phone: string, notes?: string): Customer => {
      const normalizedPhone = normalizeIndianPhone(phone);
      const existing = state.customers.find((c) => c.phone === normalizedPhone);
      if (existing) {
        if (notes && notes !== existing.notes) {
          const updated = { ...existing, notes, lastVisitAt: new Date().toISOString() };
          persistState((prev) => ({
            ...prev,
            customers: prev.customers.map((c) => (c.id === existing.id ? updated : c))
          }));
          return updated;
        }
        return existing;
      }

      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        locationId: state.locations[0]?.id || 'loc-01',
        name: name.trim() || 'Guest Customer',
        phone: normalizedPhone,
        notes: notes?.trim() || '',
        totalVisits: 1,
        createdAt: new Date().toISOString(),
        lastVisitAt: new Date().toISOString()
      };

      persistState((prev) => ({
        ...prev,
        customers: [newCust, ...prev.customers],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            staffId: currentUser?.id || 'unknown',
            staffName: currentUser?.fullName,
            action: 'CUSTOMER_CREATED',
            entityName: 'customers',
            entityId: newCust.id,
            details: { name: newCust.name, phone: newCust.phone },
            createdAt: new Date().toISOString()
          },
          ...prev.auditLogs
        ]
      }));

      // Send to backend operational log
      apiClient.sendLog({
        entityName: 'customers',
        action: 'CUSTOMER_CREATED',
        level: 'SUCCESS',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `New customer registered: ${newCust.name} (${newCust.phone})`,
        details: { customerId: newCust.id, name: newCust.name, phone: newCust.phone }
      });

      return newCust;
    },
    [currentUser, persistState, state.customers, state.locations]
  );

  const searchCustomers = useCallback(
    (query: string): Customer[] => {
      if (!query || query.trim().length === 0) return [];
      const clean = query.trim().toLowerCase();
      const normPhone = normalizeIndianPhone(query);

      return state.customers.filter((c) => {
        const matchName = c.name.toLowerCase().includes(clean);
        const matchPhone = normPhone ? c.phone.includes(normPhone) : c.phone.includes(clean);
        return matchName || matchPhone;
      });
    },
    [state.customers]
  );

  // ---------------------------------------------------------------------------
  // Session & Resource Lifecycle (Concurrency Safe)
  // ---------------------------------------------------------------------------
  const startSession = useCallback(
    (params: StartSessionParams): { success: boolean; session?: Session; error?: string } => {
      const {
        customerId,
        productId,
        variantId,
        resourceId,
        durationMinutes,
        price,
        customerPackageId
      } = params;

      // 1. Concurrency and Capacity Validation
      let targetResource: Resource | undefined;
      if (resourceId) {
        targetResource = state.resources.find((r) => r.id === resourceId);
        if (!targetResource) {
          return { success: false, error: 'Selected hardware resource does not exist.' };
        }
        if (targetResource.status === 'MAINTENANCE' || targetResource.status === 'UNAVAILABLE') {
          return { success: false, error: `${targetResource.name} is currently under maintenance or unavailable.` };
        }
        if (targetResource.capacity === 1 && targetResource.status === 'OCCUPIED') {
          return { success: false, error: `${targetResource.name} is already occupied by another active session.` };
        }
        if (targetResource.capacity > 1 && targetResource.currentOccupancy >= targetResource.capacity) {
          return {
            success: false,
            error: `Capacity limit for ${targetResource.name} (${targetResource.capacity} max) has been reached.`
          };
        }
      }

      // 2. Package Deduction Validation
      let updatedCustPackage: CustomerPackage | undefined;
      if (customerPackageId) {
        const pkg = state.customerPackages.find((cp) => cp.id === customerPackageId);
        if (!pkg) {
          return { success: false, error: 'Customer package not found.' };
        }
        if (pkg.status !== 'ACTIVE' || new Date(pkg.expiresAt).getTime() < Date.now()) {
          return { success: false, error: 'Selected package has expired.' };
        }
        if (pkg.remainingMinutes < durationMinutes) {
          return {
            success: false,
            error: `Insufficient package balance (${pkg.remainingMinutes}m left, requires ${durationMinutes}m).`
          };
        }
        updatedCustPackage = {
          ...pkg,
          remainingMinutes: pkg.remainingMinutes - durationMinutes,
          status: pkg.remainingMinutes - durationMinutes <= 0 ? 'EXHAUSTED' : 'ACTIVE'
        };
      }

      // 3. Find or Create Visit
      const activeVisit = state.visits.find((v) => v.customerId === customerId && v.status === 'ACTIVE');
      const visitId = activeVisit ? activeVisit.id : `visit-${Date.now()}`;
      const isNewVisit = !activeVisit;

      const now = new Date();
      const schedEnd = new Date(now.getTime() + durationMinutes * 60000);
      const gracePeriodMinutes = state.settings.defaultGracePeriodMinutes || 5;
      const graceEnd = new Date(schedEnd.getTime() + gracePeriodMinutes * 60000);

      const newSession: Session = {
        id: `sess-${Date.now()}`,
        visitId,
        customerId,
        productId,
        variantId,
        resourceId,
        startTime: now.toISOString(),
        durationMinutes,
        scheduledEndTime: schedEnd.toISOString(),
        gracePeriodMinutes,
        graceDeadline: graceEnd.toISOString(),
        status: 'RUNNING',
        price,
        staffStartId: currentUser?.id || 'desk-01',
        customerPackageId,
        packageMinutesUsed: customerPackageId ? durationMinutes : 0,
        createdAt: now.toISOString()
      };

      persistState((prev) => {
        // Resource update
        const nextResources = prev.resources.map((r) => {
          if (r.id === resourceId) {
            const newOccupancy = r.currentOccupancy + 1;
            return {
              ...r,
              currentOccupancy: newOccupancy,
              status: 'OCCUPIED' as const,
              updatedAt: new Date().toISOString()
            };
          }
          return r;
        });

        // Visit update
        let nextVisits = prev.visits;
        if (isNewVisit) {
          const newVisitRecord: Visit = {
            id: visitId,
            locationId: prev.locations[0]?.id || 'loc-01',
            customerId,
            checkInTime: now.toISOString(),
            status: 'ACTIVE',
            createdBy: currentUser?.id || 'desk-01'
          };
          nextVisits = [newVisitRecord, ...prev.visits];
        }

        // Customer package update
        let nextCustomerPackages = prev.customerPackages;
        let nextPackageUsages = prev.packageUsages;
        if (updatedCustPackage) {
          nextCustomerPackages = prev.customerPackages.map((cp) =>
            cp.id === updatedCustPackage!.id ? updatedCustPackage! : cp
          );
          const usageRecord: PackageUsage = {
            id: `pkgu-${Date.now()}`,
            customerPackageId: updatedCustPackage.id,
            sessionId: newSession.id,
            minutesDeducted: durationMinutes,
            deductedAt: now.toISOString(),
            staffId: currentUser?.id || 'desk-01'
          };
          nextPackageUsages = [usageRecord, ...prev.packageUsages];
        }

        // Customer visits counter
        const nextCustomers = prev.customers.map((c) =>
          c.id === customerId ? { ...c, totalVisits: c.totalVisits + (isNewVisit ? 1 : 0), lastVisitAt: now.toISOString() } : c
        );

        return {
          ...prev,
          sessions: [newSession, ...prev.sessions],
          resources: nextResources,
          visits: nextVisits,
          customers: nextCustomers,
          customerPackages: nextCustomerPackages,
          packageUsages: nextPackageUsages,
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              staffId: currentUser?.id || 'unknown',
              staffName: currentUser?.fullName,
              action: 'SESSION_STARTED',
              entityName: 'sessions',
              entityId: newSession.id,
              details: {
                resourceName: targetResource?.name,
                duration: durationMinutes,
                price
              },
              createdAt: now.toISOString()
            },
            ...prev.auditLogs
          ]
        };
      });

      // Play check-in sound if audio alerts are enabled
      if (state.settings.enableSoundAlerts !== false) {
        soundAlert.playCheckInSound();
      }

      // Send to backend operational log
      const customer = state.customers.find((c) => c.id === customerId);
      apiClient.sendLog({
        entityName: 'sessions',
        action: 'SESSION_STARTED',
        level: 'SUCCESS',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Session started for ${customer?.name || 'Customer'} on ${targetResource?.name || 'Game'} (${durationMinutes}m, ₹${price})`,
        details: {
          sessionId: newSession.id,
          customerId,
          customerName: customer?.name,
          resourceName: targetResource?.name,
          durationMinutes,
          price
        }
      });

      return { success: true, session: newSession };
    },
    [currentUser, persistState, state]
  );

  const extendSession = useCallback(
    (sessionId: string, addedMinutes: number, extraCharge: number): { success: boolean; error?: string } => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return { success: false, error: 'Session not found.' };

      const oldSchedEnd = new Date(session.scheduledEndTime).getTime();
      const newSchedEndMs = oldSchedEnd + addedMinutes * 60000;
      const newSchedEnd = new Date(newSchedEndMs);
      const newGraceEnd = new Date(newSchedEndMs + session.gracePeriodMinutes * 60000);

      const nowMs = Date.now();
      const newStatus = nowMs < newSchedEndMs ? 'RUNNING' : nowMs < newGraceEnd.getTime() ? 'DUE' : 'OVERDUE';

      const extensionRecord: SessionExtension = {
        id: `ext-${Date.now()}`,
        sessionId,
        addedMinutes,
        extraCharge,
        staffId: currentUser?.id || 'desk-01',
        extendedAt: new Date().toISOString()
      };

      persistState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                durationMinutes: s.durationMinutes + addedMinutes,
                scheduledEndTime: newSchedEnd.toISOString(),
                graceDeadline: newGraceEnd.toISOString(),
                status: newStatus,
                price: s.price + extraCharge
              }
            : s
        ),
        sessionExtensions: [extensionRecord, ...prev.sessionExtensions],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            staffId: currentUser?.id || 'unknown',
            staffName: currentUser?.fullName,
            action: 'SESSION_EXTENDED',
            entityName: 'sessions',
            entityId: sessionId,
            details: { addedMinutes, extraCharge, newEndTime: newSchedEnd.toISOString() },
            createdAt: new Date().toISOString()
          },
          ...prev.auditLogs
        ]
      }));

      // Remove from alerted set if reset back to RUNNING
      if (newStatus === 'RUNNING') {
        alertedDueSessions.current.delete(sessionId);
        alertedOverdueSessions.current.delete(sessionId);
      }

      // Log to backend
      apiClient.sendLog({
        entityName: 'sessions',
        action: 'SESSION_EXTENDED',
        level: 'INFO',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Session ${sessionId.slice(-6)} extended by +${addedMinutes} mins (+₹${extraCharge})`,
        details: { sessionId, addedMinutes, extraCharge }
      });

      return { success: true };
    },
    [currentUser, persistState, state.sessions]
  );

  const endSession = useCallback(
    (sessionId: string): { success: boolean; error?: string } => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return { success: false, error: 'Session not found.' };

      const now = new Date().toISOString();

      persistState((prev) => {
        // Release resource
        const nextResources = prev.resources.map((r) => {
          if (r.id === session.resourceId) {
            const nextOcc = Math.max(0, r.currentOccupancy - 1);
            return {
              ...r,
              currentOccupancy: nextOcc,
              status: nextOcc === 0 ? ('AVAILABLE' as const) : r.status,
              updatedAt: now
            };
          }
          return r;
        });

        const nextSessions = prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: 'COMPLETED' as const,
                actualEndTime: now,
                staffEndId: currentUser?.id || 'desk-01'
              }
            : s
        );

        return {
          ...prev,
          sessions: nextSessions,
          resources: nextResources,
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              staffId: currentUser?.id || 'unknown',
              staffName: currentUser?.fullName,
              action: 'SESSION_ENDED',
              entityName: 'sessions',
              entityId: sessionId,
              details: { actualEndTime: now },
              createdAt: now
            },
            ...prev.auditLogs
          ]
        };
      });

      alertedDueSessions.current.delete(sessionId);
      alertedOverdueSessions.current.delete(sessionId);

      // Play check-out sound if audio alerts are enabled
      if (state.settings.enableSoundAlerts !== false) {
        soundAlert.playCheckOutSound();
      }

      // Log to backend
      const res = state.resources.find((r) => r.id === session.resourceId);
      apiClient.sendLog({
        entityName: 'sessions',
        action: 'SESSION_ENDED',
        level: 'INFO',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Session ${sessionId.slice(-6)} completed on ${res?.name || 'hardware'}. Hardware marked AVAILABLE.`,
        details: { sessionId, resourceId: session.resourceId, resourceName: res?.name }
      });

      return { success: true };
    },
    [currentUser, persistState, state.resources, state.sessions, state.settings.enableSoundAlerts]
  );

  const cancelSession = useCallback(
    (sessionId: string, reason: string): { success: boolean; error?: string } => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return { success: false, error: 'Session not found.' };

      const now = new Date().toISOString();

      persistState((prev) => {
        // Free resource
        const nextResources = prev.resources.map((r) => {
          if (r.id === session.resourceId) {
            const nextOcc = Math.max(0, r.currentOccupancy - 1);
            return {
              ...r,
              currentOccupancy: nextOcc,
              status: nextOcc === 0 ? ('AVAILABLE' as const) : r.status,
              updatedAt: now
            };
          }
          return r;
        });

        // If package minutes were used, refund them back to customer package
        let nextCustPackages = prev.customerPackages;
        if (session.customerPackageId && session.packageMinutesUsed) {
          nextCustPackages = prev.customerPackages.map((cp) =>
            cp.id === session.customerPackageId
              ? {
                  ...cp,
                  remainingMinutes: cp.remainingMinutes + session.packageMinutesUsed!,
                  status: 'ACTIVE' as const
                }
              : cp
          );
        }

        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'CANCELLED' as const, actualEndTime: now } : s
          ),
          resources: nextResources,
          customerPackages: nextCustPackages,
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              staffId: currentUser?.id || 'unknown',
              staffName: currentUser?.fullName,
              action: 'SESSION_CANCELLED',
              entityName: 'sessions',
              entityId: sessionId,
              details: { reason },
              createdAt: now
            },
            ...prev.auditLogs
          ]
        };
      });

      alertedDueSessions.current.delete(sessionId);
      alertedOverdueSessions.current.delete(sessionId);

      if (state.settings.enableSoundAlerts !== false) {
        soundAlert.playCheckOutSound();
      }

      // Log to backend
      apiClient.sendLog({
        entityName: 'sessions',
        action: 'SESSION_CANCELLED',
        level: 'WARN',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Session ${sessionId.slice(-6)} cancelled: ${reason}`,
        details: { sessionId, reason }
      });

      return { success: true };
    },
    [currentUser, persistState, state.sessions, state.settings.enableSoundAlerts]
  );

  // ---------------------------------------------------------------------------
  // POS & Invoicing Engine
  // ---------------------------------------------------------------------------
  const createInvoice = useCallback(
    (params: CreateInvoiceParams): { success: boolean; invoice?: Invoice; error?: string } => {
      const {
        customerId,
        visitId,
        items,
        discount = 0,
        tax = 0,
        paymentMethod = 'CASH',
        paymentReference,
        paidAmount = 0
      } = params;

      if (!items || items.length === 0) {
        return { success: false, error: 'Invoice must contain at least one line item.' };
      }

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const totalAmount = Math.max(0, subtotal - discount + tax);
      const actualPaid = Math.min(totalAmount, Math.max(0, paidAmount));
      const balanceAmount = Math.max(0, totalAmount - actualPaid);

      const status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' =
        balanceAmount === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      const invoiceId = `inv-${Date.now()}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceNumber = `WND-${dateStr}-${randomSuffix}`;

      const newInvoice: Invoice = {
        id: invoiceId,
        locationId: state.locations[0]?.id || 'loc-01',
        customerId,
        visitId,
        invoiceNumber,
        subtotal,
        discount,
        tax,
        totalAmount,
        paidAmount: actualPaid,
        balanceAmount,
        status,
        staffId: currentUser?.id || 'desk-01',
        createdAt: new Date().toISOString()
      };

      const lineItems: InvoiceItem[] = items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        invoiceId,
        itemType: item.itemType,
        referenceId: item.referenceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }));

      // Payment record if paidAmount > 0
      let newPayment: Payment | undefined;
      let newAllocation: PaymentAllocation | undefined;

      if (actualPaid > 0) {
        const paymentId = `pay-${Date.now()}`;
        newPayment = {
          id: paymentId,
          locationId: state.locations[0]?.id || 'loc-01',
          customerId,
          invoiceId,
          amount: actualPaid,
          paymentMethod,
          referenceNumber: paymentReference,
          status: 'CONFIRMED',
          receivedBy: currentUser?.id || 'desk-01',
          createdAt: new Date().toISOString()
        };

        newAllocation = {
          id: `alloc-${Date.now()}`,
          paymentId,
          invoiceId,
          allocatedAmount: actualPaid,
          allocatedAt: new Date().toISOString()
        };
      }

      persistState((prev) => ({
        ...prev,
        invoices: [newInvoice, ...prev.invoices],
        invoiceItems: [...lineItems, ...prev.invoiceItems],
        payments: newPayment ? [newPayment, ...prev.payments] : prev.payments,
        paymentAllocations: newAllocation ? [newAllocation, ...prev.paymentAllocations] : prev.paymentAllocations,
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            staffId: currentUser?.id || 'unknown',
            staffName: currentUser?.fullName,
            action: 'INVOICE_CREATED',
            entityName: 'invoices',
            entityId: newInvoice.id,
            details: {
              invoiceNumber: newInvoice.invoiceNumber,
              totalAmount,
              paidAmount: actualPaid,
              status
            },
            createdAt: new Date().toISOString()
          },
          ...prev.auditLogs
        ]
      }));

      // Log to backend
      apiClient.sendLog({
        entityName: 'invoices',
        action: 'INVOICE_CREATED',
        level: 'SUCCESS',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Invoice ${newInvoice.invoiceNumber} created: ₹${totalAmount} (${status}, Paid: ₹${actualPaid})`,
        details: { invoiceId, invoiceNumber: newInvoice.invoiceNumber, totalAmount, paidAmount: actualPaid, status }
      });

      return { success: true, invoice: newInvoice };
    },
    [currentUser, persistState, state.locations]
  );

  const recordPayment = useCallback(
    (params: {
      invoiceId: string;
      amount: number;
      paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
      referenceNumber?: string;
      notes?: string;
    }): { success: boolean; error?: string } => {
      const invoice = state.invoices.find((i) => i.id === params.invoiceId);
      if (!invoice) return { success: false, error: 'Invoice not found.' };

      if (params.amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };

      const allowableAmount = Math.min(params.amount, invoice.balanceAmount);
      const newPaidTotal = invoice.paidAmount + allowableAmount;
      const newBalance = Math.max(0, invoice.totalAmount - newPaidTotal);
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

      const paymentId = `pay-${Date.now()}`;
      const paymentRecord: Payment = {
        id: paymentId,
        locationId: state.locations[0]?.id || 'loc-01',
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount: allowableAmount,
        paymentMethod: params.paymentMethod,
        referenceNumber: params.referenceNumber,
        status: 'CONFIRMED',
        notes: params.notes,
        receivedBy: currentUser?.id || 'desk-01',
        createdAt: new Date().toISOString()
      };

      const allocationRecord: PaymentAllocation = {
        id: `alloc-${Date.now()}`,
        paymentId,
        invoiceId: invoice.id,
        allocatedAmount: allowableAmount,
        allocatedAt: new Date().toISOString()
      };

      persistState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === params.invoiceId ? { ...inv, paidAmount: newPaidTotal, balanceAmount: newBalance, status: newStatus } : inv
        ),
        payments: [paymentRecord, ...prev.payments],
        paymentAllocations: [allocationRecord, ...prev.paymentAllocations],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            staffId: currentUser?.id || 'unknown',
            staffName: currentUser?.fullName,
            action: 'PAYMENT_RECORDED',
            entityName: 'payments',
            entityId: paymentId,
            details: { invoiceNumber: invoice.invoiceNumber, amount: allowableAmount, method: params.paymentMethod },
            createdAt: new Date().toISOString()
          },
          ...prev.auditLogs
        ]
      }));

      // Log to backend
      apiClient.sendLog({
        entityName: 'payments',
        action: 'PAYMENT_RECORDED',
        level: 'SUCCESS',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Payment received: ₹${allowableAmount} (${params.paymentMethod}) for ${invoice.invoiceNumber}`,
        details: { paymentId, invoiceNumber: invoice.invoiceNumber, amount: allowableAmount, method: params.paymentMethod, referenceNumber: params.referenceNumber }
      });

      return { success: true };
    },
    [currentUser, persistState, state.invoices, state.locations]
  );

  const reconcilePayment = useCallback(
    (paymentId: string, status: 'CONFIRMED' | 'UNMATCHED' | 'REFUNDED', targetInvoiceId?: string) => {
      persistState((prev) => {
        const payment = prev.payments.find((p) => p.id === paymentId);
        if (!payment) return prev;

        let nextInvoices = prev.invoices;
        let nextAllocations = prev.paymentAllocations;

        // If newly confirmed and linked to an invoice
        if (status === 'CONFIRMED' && targetInvoiceId) {
          const inv = prev.invoices.find((i) => i.id === targetInvoiceId);
          if (inv) {
            const addedPaid = Math.min(payment.amount, inv.balanceAmount);
            const newPaid = inv.paidAmount + addedPaid;
            const newBalance = Math.max(0, inv.totalAmount - newPaid);
            nextInvoices = prev.invoices.map((i) =>
              i.id === targetInvoiceId
                ? { ...i, paidAmount: newPaid, balanceAmount: newBalance, status: newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID' }
                : i
            );
            nextAllocations = [
              {
                id: `alloc-${Date.now()}`,
                paymentId,
                invoiceId: targetInvoiceId,
                allocatedAmount: addedPaid,
                allocatedAt: new Date().toISOString()
              },
              ...prev.paymentAllocations
            ];
          }
        }

        return {
          ...prev,
          payments: prev.payments.map((p) =>
            p.id === paymentId ? { ...p, status, invoiceId: targetInvoiceId || p.invoiceId } : p
          ),
          invoices: nextInvoices,
          paymentAllocations: nextAllocations,
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              staffId: currentUser?.id || 'unknown',
              staffName: currentUser?.fullName,
              action: 'PAYMENT_RECONCILED',
              entityName: 'payments',
              entityId: paymentId,
              details: { newStatus: status, targetInvoiceId },
              createdAt: new Date().toISOString()
            },
            ...prev.auditLogs
          ]
        };
      });
    },
    [currentUser, persistState]
  );

  const purchasePackage = useCallback(
    (customerId: string, packageId: string, paymentMethod: 'CASH' | 'UPI' | 'CARD') => {
      const pkg = state.packages.find((p) => p.id === packageId);
      if (!pkg) return { success: false, error: 'Package definition not found.' };

      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer) return { success: false, error: 'Customer not found.' };

      const now = new Date();
      const expiresAt = new Date(now.getTime() + pkg.validityDays * 86400000);

      // Create invoice for package purchase
      const invoiceRes = createInvoice({
        customerId,
        items: [
          {
            itemType: 'PACKAGE',
            referenceId: pkg.id,
            description: `${pkg.name} (${pkg.allocatedMinutes} Mins, ${pkg.validityDays} Days)`,
            quantity: 1,
            unitPrice: pkg.price
          }
        ],
        paidAmount: pkg.price,
        paymentMethod
      });

      if (!invoiceRes.success || !invoiceRes.invoice) {
        return { success: false, error: 'Failed to generate package invoice.' };
      }

      const newCustomerPackage: CustomerPackage = {
        id: `cpkg-${Date.now()}`,
        customerId,
        packageId,
        allocatedMinutes: pkg.allocatedMinutes,
        remainingMinutes: pkg.allocatedMinutes,
        purchasedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'ACTIVE',
        invoiceId: invoiceRes.invoice.id
      };

      persistState((prev) => ({
        ...prev,
        customerPackages: [newCustomerPackage, ...prev.customerPackages],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            staffId: currentUser?.id || 'unknown',
            staffName: currentUser?.fullName,
            action: 'PACKAGE_PURCHASED',
            entityName: 'customer_packages',
            entityId: newCustomerPackage.id,
            details: { packageName: pkg.name, customerName: customer.name, price: pkg.price },
            createdAt: now.toISOString()
          },
          ...prev.auditLogs
        ]
      }));

      // Log to backend
      apiClient.sendLog({
        entityName: 'packages',
        action: 'PACKAGE_PURCHASED',
        level: 'SUCCESS',
        staffId: currentUser?.id,
        staffName: currentUser?.fullName,
        message: `Package purchased: "${pkg.name}" for ${customer.name} (₹${pkg.price}, ${pkg.allocatedMinutes} mins)`,
        details: { customerPackageId: newCustomerPackage.id, packageId: pkg.id, customerName: customer.name, price: pkg.price }
      });

      return { success: true, customerPackage: newCustomerPackage };
    },
    [createInvoice, currentUser, persistState, state.customers, state.packages]
  );

  const updateResourceStatus = useCallback(
    (resourceId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE', capacity?: number) => {
      persistState((prev) => ({
        ...prev,
        resources: prev.resources.map((r) =>
          r.id === resourceId
            ? {
                ...r,
                status,
                capacity: capacity !== undefined ? capacity : r.capacity,
                currentOccupancy: status === 'AVAILABLE' ? 0 : r.currentOccupancy,
                updatedAt: new Date().toISOString()
              }
            : r
        )
      }));
    },
    [persistState]
  );

  const updateProductPrice = useCallback(
    (productId: string, newPrice: number) => {
      persistState((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === productId ? { ...p, defaultPrice: newPrice } : p))
      }));
    },
    [persistState]
  );

  const updateProductVariantPrice = useCallback(
    (variantId: string, newPrice: number) => {
      persistState((prev) => ({
        ...prev,
        productVariants: prev.productVariants.map((v) => (v.id === variantId ? { ...v, price: newPrice } : v))
      }));
    },
    [persistState]
  );

  const acknowledgeNotification = useCallback(
    (notificationId: string) => {
      persistState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isAcknowledged: true, acknowledgedBy: currentUser?.id, acknowledgedAt: new Date().toISOString() }
            : n
        )
      }));
    },
    [currentUser, persistState]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<SystemSettings>) => {
      persistState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      }));
    },
    [persistState]
  );

  const resetAllData = useCallback(() => {
    storageEngine.resetToDefault();
    setState(storageEngine.getState());
  }, []);

  const importWorkbookData = useCallback(
    (newInvoices: Invoice[], newCustomers: Customer[]) => {
      persistState((prev) => {
        // Merge without duplicates
        const existingPhones = new Set(prev.customers.map((c) => c.phone));
        const mergedCustomers = [...prev.customers];
        newCustomers.forEach((nc) => {
          if (!existingPhones.has(nc.phone)) {
            existingPhones.add(nc.phone);
            mergedCustomers.push(nc);
          }
        });

        const existingInvNos = new Set(prev.invoices.map((i) => i.invoiceNumber.toLowerCase()));
        const mergedInvoices = [...prev.invoices];
        newInvoices.forEach((ni) => {
          if (!existingInvNos.has(ni.invoiceNumber.toLowerCase())) {
            existingInvNos.add(ni.invoiceNumber.toLowerCase());
            mergedInvoices.push(ni);
          }
        });

        return {
          ...prev,
          customers: mergedCustomers,
          invoices: mergedInvoices,
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              staffId: currentUser?.id || 'unknown',
              staffName: currentUser?.fullName,
              action: 'WORKBOOK_IMPORTED',
              entityName: 'import_jobs',
              details: { importedInvoicesCount: newInvoices.length, importedCustomersCount: newCustomers.length },
              createdAt: new Date().toISOString()
            },
            ...prev.auditLogs
          ]
        };
      });
    },
    [currentUser, persistState]
  );

  return (
    <ArcadeContext.Provider
      value={{
        state,
        findOrCreateCustomer,
        searchCustomers,
        startSession,
        extendSession,
        endSession,
        cancelSession,
        createInvoice,
        recordPayment,
        reconcilePayment,
        purchasePackage,
        updateResourceStatus,
        updateProductPrice,
        updateProductVariantPrice,
        acknowledgeNotification,
        updateSettings,
        resetAllData,
        importWorkbookData
      }}
    >
      {children}
    </ArcadeContext.Provider>
  );
};

export const useArcade = () => {
  const context = useContext(ArcadeContext);
  if (!context) {
    throw new Error('useArcade must be used within an ArcadeProvider');
  }
  return context;
};
