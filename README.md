# Wonderland Arcade Management System

A high-performance, resilient, full-stack arcade management system designed specifically for **Wonderland**, an entertainment arcade providing PlayStation gaming, snooker, soft play, arcade machines, VR experiences, chair massage, and sports simulators.

Built with a free-first architectural strategy (React 19, TypeScript, Vite, Tailwind CSS, PostgreSQL/Supabase schema, and a client/server transactional storage engine).

---

## Key Features

1. **High-Speed Receptionist Check-In (< 15 seconds)**:
   - Instant customer lookup by name or normalized Indian mobile (+91 format handling).
   - Dynamic product & game selector with physical resource assignment.
   - Package balance deduction with validity check.
   - Multi-game visit support (single customer or group playing multiple games concurrently).

2. **Server-Authoritative Session Timers**:
   - Timers rely strictly on persisted ISO timestamps, never client tick counters.
   - Survives browser refreshes, tab closures, network dropouts, and multi-device logins.
   - Configurable **5-minute grace period** with distinct visual alert transitions:
     `Running` -> `Due (0m left)` -> `Overdue (Grace expired)`.
   - In-app chime and alert banner notifications for receptionists.
   - 1-click session extension with automatic fee calculation.
   - Immediate physical resource release upon checkout.

3. **Physical Resource & Capacity Management**:
   - Tracks individual hardware (PS5 Consoles #1-#6, Snooker Tables #1-#2, 8-Ball Tables, VR Stations, Massagers).
   - Enforces capacity for shared zones (Soft Play max occupancy: 25).
   - Maintenance status prevents accidental assignment.

4. **Point of Sale (POS) & Invoicing**:
   - Multi-item invoices (Time-based gaming, Per-over cricket, Unit-based arcade tokens, Package passes).
   - Split payments (Cash, UPI with UTR reference, Card).
   - Partial payments and real-time outstanding balance tracking.

5. **UPI Reconciliation & Financial Safety**:
   - Distinct separation between **Sales Value** and **Confirmed Receipts**.
   - Pending Reconciliation queue for unverified UPI credits.
   - Complete audit trail for corrections and invoice adjustments.

6. **Owner Analytics & Business Intelligence**:
   - Real-time operational dashboard (active sessions, occupied hardware, today's customer count).
   - Financial KPIs (sales, cash vs UPI collections, outstanding balances, average ticket size).
   - Game popularity and resource utilization reports.
   - Asia/Kolkata timezone standard.

7. **Data Resilience & Recovery**:
   - Instant export to CSV/JSON.
   - Full PostgreSQL migration scripts (`supabase/migrations/`) ready for Supabase free-tier deployment.
   - Workbook importer for historical data from `Wonderland.xlsm.xlsx`.

---

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit the app at `http://localhost:3000`.

### Staff Accounts (Initial Setup)
The application includes a setup wizard to create your first Owner account or log in with default operational profiles:
- **Owner**: `owner@wonderland.com` (Full admin, pricing, reports, resource config)
- **Receptionist**: `desk@wonderland.com` (Operational check-in, active timers, invoice creation, payment recording)

---

## Documentation
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema & Migrations](docs/DATABASE_SCHEMA.md)
- [Business Rules & Logic](docs/BUSINESS_RULES.md)
- [Test Plan & Verification](docs/TEST_PLAN.md)
- [Deployment Guide (Cloudflare Pages + Supabase)](docs/DEPLOYMENT.md)
- [Integrations (UPI & WhatsApp Business)](docs/INTEGRATIONS.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
