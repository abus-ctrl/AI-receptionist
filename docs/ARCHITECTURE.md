# Wonderland Arcade Architecture

## 1. System Overview

Wonderland Arcade Management System operates on a **Free-First Full-Stack Architecture**, engineered for maximum resilience, sub-second latency at the reception desk, and zero runtime cost for an initial single-location deployment.

```
+-------------------------------------------------------------------------+
|                         Frontend Web Client                             |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons             |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | Check-In / POS     |  | Live Timers Engine |  | Reports & BI       | |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | Customer Profiles  |  | Resource Manager   |  | Reconciliation     | |
|  +--------------------+  +--------------------+  +--------------------+ |
+-------------------------------------------------------------------------+
                                    |
                    API Layer & Storage Adapter
                                    |
          +-------------------------+-------------------------+
          |                                                   |
+-------------------+                               +--------------------+
|  Transactional    |                               |  Supabase /        |
|  Storage Engine   |                               |  PostgreSQL Cloud  |
|  (IndexedDB /     |                               |  Database          |
|  localStorage     |                               |  (Migrations & RLS |
|  with Concurrency |                               |  pre-configured)   |
|  Controls)        |                               +--------------------+
+-------------------+
```

## 2. Core Architectural Principles

1. **Server-Authoritative Timestamps**:
   All session start times, scheduled ends, and grace deadlines are stored as absolute UTC ISO strings. The client UI computes `remainingSeconds = Math.max(0, Math.floor((scheduledEnd - Date.now()) / 1000))` purely for rendering. A browser crash or page reload recalculates the true state instantaneously without drift.

2. **Dual-Mode Persistence**:
   - **Local Resilient Database Engine**: Built with atomic transactional operations, concurrency locks, indexing, and strict schema validation. Enables offline front-desk operation even during ISP outages.
   - **Cloud PostgreSQL Migration Path**: Complete standard SQL migration scripts with foreign keys, checks, and Row Level Security (RLS) policies for connecting to a free-tier Supabase project at any time.

3. **Concurrency & Resource Locking**:
   To prevent double-booking single-capacity resources (e.g. reserving PS5 Console #3 simultaneously from two screens), reservations require an atomic state transition:
   `resource.status === 'AVAILABLE'` -> `resource.status = 'OCCUPIED'`, with a version lock / concurrency check.

4. **Data Isolation & Financial Accuracy**:
   - Invoices record fixed snapshot prices (`unit_price` at the exact moment of sale), immune to subsequent catalogue price edits.
   - Payments are recorded as separate transaction records linked to invoices, supporting partial payments, multiple payment methods (Cash, UPI), and unmatched transactions.

5. **Role-Based Access Control (RBAC)**:
   - `owner`: System settings, price adjustments, staff management, audit log inspection, financial reconciliation, full reporting.
   - `receptionist`: Customer lookup & creation, session start/extend/end, POS invoicing, payment receipt entry, live dashboard.
