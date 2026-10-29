-- Wonderland Arcade Management System
-- Migration 002: Row Level Security (RLS) & Server Functions

-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current User Role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Profiles readable by authenticated staff"
    ON profiles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Profiles manageable only by owners"
    ON profiles FOR ALL TO authenticated
    USING (get_current_user_role() = 'owner');

-- 2. Operational Tables Policies (Customers, Visits, Sessions, Invoices, Payments)
-- Staff (receptionist or owner) can read and write customer operations
CREATE POLICY "Staff read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff update customers" ON customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Staff read visits" ON visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff write visits" ON visits FOR ALL TO authenticated USING (true);

CREATE POLICY "Staff read sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff write sessions" ON sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Staff read invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff write invoices" ON invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Staff read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff write payments" ON payments FOR ALL TO authenticated USING (true);

-- 3. Audit Logs: Append-only for all staff, full select for owners
CREATE POLICY "Staff insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners read all audit logs" ON audit_logs FOR SELECT TO authenticated
    USING (get_current_user_role() = 'owner');

-- =========================================================================
-- ATOMIC CONCURRENCY FUNCTIONS
-- =========================================================================

-- Function: Start Session with Resource Lock
CREATE OR REPLACE FUNCTION start_game_session(
    p_visit_id UUID,
    p_customer_id UUID,
    p_product_id UUID,
    p_variant_id UUID,
    p_resource_id UUID,
    p_duration_minutes INT,
    p_price NUMERIC,
    p_staff_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_resource_status VARCHAR;
    v_resource_cap INT;
    v_current_occ INT;
    v_now TIMESTAMPTZ := NOW();
    v_sched_end TIMESTAMPTZ;
    v_grace_deadline TIMESTAMPTZ;
BEGIN
    v_sched_end := v_now + (p_duration_minutes || ' minutes')::INTERVAL;
    v_grace_deadline := v_sched_end + INTERVAL '5 minutes';

    -- Concurrency check if resource is specified
    IF p_resource_id IS NOT NULL THEN
        SELECT status, capacity, current_occupancy
        INTO v_resource_status, v_resource_cap, v_current_occ
        FROM resources
        WHERE id = p_resource_id
        FOR UPDATE;

        IF v_resource_status = 'MAINTENANCE' OR v_resource_status = 'UNAVAILABLE' THEN
            RAISE EXCEPTION 'Resource is currently under maintenance or unavailable';
        END IF;

        IF v_resource_cap = 1 AND v_resource_status = 'OCCUPIED' THEN
            RAISE EXCEPTION 'Resource is already occupied by another active session';
        END IF;

        IF v_resource_cap > 1 AND v_current_occ >= v_resource_cap THEN
            RAISE EXCEPTION 'Shared resource capacity limit (%) reached', v_resource_cap;
        END IF;

        -- Update resource occupancy
        UPDATE resources
        SET status = 'OCCUPIED',
            current_occupancy = current_occupancy + 1,
            updated_at = NOW()
        WHERE id = p_resource_id;
    END IF;

    -- Insert session
    INSERT INTO sessions (
        visit_id, customer_id, product_id, variant_id, resource_id,
        start_time, duration_minutes, scheduled_end_time, grace_period_minutes,
        grace_deadline, status, price, staff_start_id
    ) VALUES (
        p_visit_id, p_customer_id, p_product_id, p_variant_id, p_resource_id,
        v_now, p_duration_minutes, v_sched_end, 5,
        v_grace_deadline, 'RUNNING', p_price, p_staff_id
    ) RETURNING id INTO v_session_id;

    -- Audit log
    INSERT INTO audit_logs (staff_id, action, entity_name, entity_id, details)
    VALUES (p_staff_id, 'SESSION_STARTED', 'sessions', v_session_id, json_build_object(
        'product_id', p_product_id,
        'resource_id', p_resource_id,
        'duration', p_duration_minutes,
        'price', p_price
    ));

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: End Game Session and Release Resource
CREATE OR REPLACE FUNCTION end_game_session(
    p_session_id UUID,
    p_staff_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_res_id UUID;
    v_res_cap INT;
BEGIN
    SELECT resource_id INTO v_res_id
    FROM sessions
    WHERE id = p_session_id AND status IN ('RUNNING', 'DUE', 'OVERDUE')
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active session not found or already completed';
    END IF;

    -- Update session state
    UPDATE sessions
    SET status = 'COMPLETED',
        actual_end_time = NOW(),
        staff_end_id = p_staff_id,
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Release resource if assigned
    IF v_res_id IS NOT NULL THEN
        SELECT capacity INTO v_res_cap FROM resources WHERE id = v_res_id FOR UPDATE;

        IF v_res_cap = 1 THEN
            UPDATE resources
            SET status = 'AVAILABLE',
                current_occupancy = 0,
                updated_at = NOW()
            WHERE id = v_res_id;
        ELSE
            UPDATE resources
            SET current_occupancy = GREATEST(0, current_occupancy - 1),
                status = CASE WHEN current_occupancy - 1 <= 0 THEN 'AVAILABLE' ELSE 'OCCUPIED' END,
                updated_at = NOW()
            WHERE id = v_res_id;
        END IF;
    END IF;

    -- Audit log
    INSERT INTO audit_logs (staff_id, action, entity_name, entity_id, details)
    VALUES (p_staff_id, 'SESSION_ENDED', 'sessions', p_session_id, json_build_object(
        'end_time', NOW(),
        'resource_id', v_res_id
    ));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
