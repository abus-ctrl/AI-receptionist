# Wonderland Database Schema & Entity Design

This schema implements all 22 entities required by the specification, structured for PostgreSQL / Supabase, with full relational integrity, foreign keys, indexes, and auditability.

---

## Entity Relationship Overview

1. `locations`: Arcade branches (supports multi-location expansion).
2. `profiles`: Staff accounts (Owner, Receptionist) linked to auth users.
3. `customers`: Visitors identified by name and normalized mobile (+91).
4. `visits`: Attendance sessions per customer, grouping multiple games and invoices.
5. `game_categories`: PlayStation, Snooker, VR, Soft Play, Massagers, Arcade, Sports.
6. `products`: Purchasable offerings (e.g., PS 1 Player, Snooker 60m, Meta Bat).
7. `product_variants`: Durations, player configurations, and prices.
8. `resources`: Physical hardware (PS5 #1-#6, Snooker Table #1-#2, Massagers).
9. `resource_capacity`: Limits for shared areas (e.g., Soft Play max 25).
10. `sessions`: Timed or counted active game instances.
11. `session_extensions`: Incremental time additions with associated fee history.
12. `packages`: Reusable prepaid cards (e.g., PKG Snooker 30D, PS 15D).
13. `customer_packages`: Customer-owned package instances with minutes balance.
14. `package_usage`: Minute deduction ledger per session.
15. `invoices`: Financial bill with total, tax, discount, balance, and status.
16. `invoice_items`: Snapshot line items for products, sessions, or packages.
17. `payments`: Monies received (Cash, UPI with UTR, Card).
18. `payment_allocations`: Mapping payments to specific invoices.
19. `payment_imports`: Bulk bank/UPI statement logs for reconciliation.
20. `notifications`: In-app and WhatsApp alerts with acknowledgment logs.
21. `audit_logs`: Immutable ledger of receptionist and owner actions.
22. `import_jobs`: Records of Excel workbook migrations and validation errors.

---

## Detailed Table Definitions (SQL Migration Ready)

```sql
-- 1. Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    location_id UUID REFERENCES locations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'receptionist')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    notes TEXT,
    total_visits INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- 4. Visits
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    customer_id UUID REFERENCES customers(id),
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id)
);

-- 5. Game Categories
CREATE TABLE game_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- 6. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES game_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pricing_type VARCHAR(20) NOT NULL CHECK (pricing_type IN ('TIME_BASED', 'UNIT_BASED', 'PER_OVER', 'DAY_PASS')),
    default_price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Product Variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(100) NOT NULL,
    duration_minutes INT,
    player_count INT DEFAULT 1,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. Resources
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    category_id UUID REFERENCES game_categories(id),
    name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE')),
    capacity INT DEFAULT 1,
    current_occupancy INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Resource Capacity
CREATE TABLE resource_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id),
    max_capacity INT NOT NULL,
    alert_threshold INT DEFAULT 20,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    resource_id UUID REFERENCES resources(id),
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    grace_period_minutes INT DEFAULT 5,
    grace_deadline TIMESTAMPTZ NOT NULL,
    actual_end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'DUE', 'OVERDUE', 'COMPLETED', 'CANCELLED')),
    price NUMERIC(10,2) NOT NULL,
    staff_start_id UUID REFERENCES profiles(id),
    staff_end_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Session Extensions
CREATE TABLE session_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    added_minutes INT NOT NULL,
    extra_charge NUMERIC(10,2) DEFAULT 0,
    staff_id UUID REFERENCES profiles(id),
    extended_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Packages
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    allocated_minutes INT NOT NULL,
    validity_days INT NOT NULL,
    eligible_category_id UUID REFERENCES game_categories(id),
    max_players INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 13. Customer Packages
CREATE TABLE customer_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    package_id UUID REFERENCES packages(id),
    allocated_minutes INT NOT NULL,
    remaining_minutes INT NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'EXHAUSTED')),
    invoice_id UUID
);

-- 14. Package Usage
CREATE TABLE package_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_package_id UUID REFERENCES customer_packages(id),
    session_id UUID REFERENCES sessions(id),
    minutes_deducted INT NOT NULL,
    deducted_at TIMESTAMPTZ DEFAULT NOW(),
    staff_id UUID REFERENCES profiles(id)
);

-- 15. Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    customer_id UUID REFERENCES customers(id),
    visit_id UUID REFERENCES visits(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    balance_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID')),
    staff_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Invoice Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('SESSION', 'PRODUCT', 'PACKAGE', 'EXTENSION', 'CUSTOM')),
    reference_id UUID,
    description VARCHAR(200) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL
);

-- 17. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    customer_id UUID REFERENCES customers(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'CARD', 'OTHER')),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'UNMATCHED', 'REFUNDED')),
    notes TEXT,
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Payment Allocations
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    invoice_id UUID REFERENCES invoices(id),
    allocated_amount NUMERIC(10,2) NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Payment Imports
CREATE TABLE payment_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_filename VARCHAR(255),
    total_records INT NOT NULL,
    matched_records INT DEFAULT 0,
    unmatched_records INT DEFAULT 0,
    imported_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('DUE', 'OVERDUE', 'CAPACITY_WARNING', 'SYSTEM')),
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    channel VARCHAR(20) DEFAULT 'IN_APP',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Import Jobs
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    total_rows INT DEFAULT 0,
    imported_rows INT DEFAULT 0,
    error_count INT DEFAULT 0,
    validation_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
