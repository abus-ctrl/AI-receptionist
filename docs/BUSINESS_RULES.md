# Wonderland Business Rules & Operational Policies

## 1. Customer Management & Mobile Normalization
- Customers are identified by Name and Phone Number.
- Mobile numbers must be normalized to standard 10-digit Indian numbers (stripping `+91`, spaces, hyphens, and leading `0`).
  Example: `+91 98765-43210` -> `9876543210`.
- Duplicate check matches against existing normalized numbers. If matched, receptionists can select the existing profile or create a fresh entry if family members share a number.

## 2. Resource Allocation & Concurrency
- Single-capacity hardware (e.g. PS5 Console #1, Snooker Table #1) can only be assigned to **one active session at a time**.
- Attempting to reserve an occupied or maintenance resource will fail atomically.
- Shared-capacity zones (e.g. Soft Play area) have a configured maximum capacity (default: 25 children). When occupancy reaches capacity, further check-ins are blocked until a child logs out.
- A resource is automatically returned to `AVAILABLE` status as soon as the session is ended/logged out.

## 3. Session Timers & Grace Period
- **Server-Authoritative**: Timers calculate countdowns using:
  `remaining_time = scheduled_end_time - current_time`.
- **Scheduled End**: `start_time + duration_minutes`.
- **Configured Grace Period**: Default 5 minutes (Owner-configurable from 0 to 15 minutes).
- **Grace Deadline**: `scheduled_end_time + grace_period_minutes`.
- **State Progression**:
  - `RUNNING`: `current_time < scheduled_end_time`.
  - `DUE`: `scheduled_end_time <= current_time < grace_deadline`. Receptionist alerted to inform customer.
  - `OVERDUE`: `current_time >= grace_deadline`. Highlighted alert for immediate staff intervention.
- The grace period is an operational courtesy buffer; it does **not** alter invoice amounts or automatically add billable minutes without staff authorization.

## 4. Session Extension
- A session can be extended while Running, Due, or Overdue.
- Extension extends the `scheduled_end_time` by the requested minutes, shifts the `grace_deadline`, and computes the incremental price.
- Extension logs the staff member, previous deadline, new deadline, and timestamps into `session_extensions`.

## 5. Packages & Balance Tracking
- Packages provide a pool of minutes (e.g. 1800 minutes for PKG Snooker 30D).
- Validity period (e.g. 15 days, 30 days) is evaluated independently from the minute balance:
  `is_valid = remaining_minutes > 0 AND current_time <= expires_at`.
- Package minutes can only be applied to eligible activities specified in the package definition.
- Package usage deductions are logged in `package_usage` with the corresponding session ID.

## 6. Financial Integrity & Invoicing
- Prices are frozen on invoice line items as snapshot values upon invoice creation. Subsequent catalogue price changes never modify existing invoices.
- **Sales vs Confirmed Collections**:
  - **Gross Sales**: Total invoiced value across all finalized bills.
  - **Confirmed Collections**: Actual money received and cleared via Cash, Verified UPI, or Card.
  - **Outstanding**: `total_invoiced - total_confirmed_payments`.
- Partial payments are supported; outstanding balances remain tracked per customer visit.

## 7. UPI Reconciliation
- Receptionist logs the customer's UPI transaction reference / UTR when available.
- Payments without immediate confirmation or matching bank feeds enter the **Pending Reconciliation** queue.
- Unmatched or unverified payments are excluded from confirmed cash flow reports until verified by the Owner.
