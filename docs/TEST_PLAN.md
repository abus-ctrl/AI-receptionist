# Wonderland Test Plan & Verification Matrix

This test plan defines the automated, manual, and edge-case testing protocols across all core workflows.

---

## 1. Automated Test Suites

### Suite A: Customer & Phone Normalization
- Test: Normalization of standard 10-digit Indian numbers (`9876543210`).
- Test: Normalization with `+91`, country code, spaces, dashes (`+91 98765-43210` -> `9876543210`).
- Test: Rejection of invalid phone lengths (<10 digits or non-numeric).
- Test: Fast search lookup by substring of customer name and phone.

### Suite B: Resource Allocation & Concurrency
- Test: Assigning an available resource sets status to `OCCUPIED`.
- Test: Attempting to assign an occupied resource is blocked with an error.
- Test: Attempting to assign a resource in `MAINTENANCE` is blocked.
- Test: Soft Play capacity counter increases on check-in and decrements on check-out.
- Test: Soft Play capacity check blocks check-in once limit (25) is reached.
- Test: Resource is unlocked immediately upon session termination (`COMPLETED`).

### Suite C: Timer Calculations & Grace Period Progression
- Test: Scheduled end calculated as `startTime + durationMinutes * 60000`.
- Test: Grace deadline calculated as `scheduledEnd + gracePeriodMinutes * 60000`.
- Test: State transition:
  - `now < scheduledEnd` => `RUNNING`.
  - `scheduledEnd <= now < graceDeadline` => `DUE`.
  - `now >= graceDeadline` => `OVERDUE`.
- Test: Extending session by 30 mins updates scheduled end and transitions state from `OVERDUE` back to `RUNNING`.
- Test: Browser refresh / timer recalculation from persisted timestamps produces exact identical remaining time.

### Suite D: Packages & Minute Balances
- Test: Package minute deduction reduces `remaining_minutes`.
- Test: Package with 0 remaining minutes cannot be applied to new sessions.
- Test: Expired package (`now > expires_at`) cannot be applied even if remaining minutes > 0.
- Test: Package usage audit trail records exact session ID, timestamp, and minutes used.

### Suite E: POS Invoicing & Payment Reconciliation
- Test: Invoicing with mixed items (PS5 session + Cold drink / unit item + Cricket per-over).
- Test: Partial payment sets invoice status to `PARTIALLY_PAID` with correct `balance_amount`.
- Test: Full payment transitions status to `PAID`.
- Test: Confirmed revenue calculations include only cleared payments, excluding `PENDING` or `UNMATCHED` items.

### Suite F: Excel Importer Engine
- Test: Parse standard `Wonderland.xlsm.xlsx` sheets.
- Test: Detect duplicate invoice numbers and report warning.
- Test: Reject malformed dates without discarding valid rows.
- Test: Catalogue verification against listed products.
