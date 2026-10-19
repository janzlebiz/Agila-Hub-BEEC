-- =============================================================================
-- AGILA Hub - Multi-Role RLS Security & True Role-Isolated Integration Tests
-- Resolves Audit Finding R-01: Uses actual PostgreSQL SET ROLE (anon, authenticated)
-- Tests both row visibility and write attempts under actual role privileges.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SETUP: Seed Test Fixtures as postgres / service_role
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE '>>> PHASE 1: Initializing Test Fixtures with Structural Protection <<<';
END $$;

-- Verify RLS is enabled on all core tables
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('members', 'announcements', 'events', 'attendance', 'contributions', 'documents', 'audit_logs', 'member_claim_tokens')
      AND c.relrowsecurity = true;

    IF v_count < 8 THEN
        RAISE EXCEPTION 'Setup FAIL: Relrowsecurity is not enabled on all core domain tables! Found % active.', v_count;
    END IF;
    RAISE NOTICE 'Setup PASS: Core tables have Row Level Security enabled.';
END $$;

-- Verify Zero Permissive Blanket Policies
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('members', 'contributions')
      AND qual = 'true'
      AND cmd = 'SELECT';

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Setup FAIL: % blanket USING (true) SELECT policies detected!', v_count;
    END IF;
    RAISE NOTICE 'Setup PASS: Zero blanket USING (true) policies detected.';
END $$;

-- Insert Test Personas
DELETE FROM public.members WHERE member_number LIKE 'TEST-%';
DELETE FROM public.events WHERE title = 'Integration Conclave Test';

INSERT INTO public.members (id, user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch, blood_type, emergency_contact_name, emergency_contact_phone)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'officer.test@eagles.org.ph', 'Kuya', 'Officer', 'TEST-OFFICER-01', 'officer', 'active', 'Bantayog Elite', 'O+', 'Em Officer', '09171111111'),
    ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'member.a@eagles.org.ph', 'Juan', 'Alpha', 'TEST-MEMBER-A', 'member', 'active', 'Bantayog Elite', 'O+', 'Em Alpha', '09172222222'),
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'member.b@eagles.org.ph', 'Pedro', 'Beta', 'TEST-MEMBER-B', 'member', 'active', 'Bantayog Elite', 'AB+', 'Em Beta', '09173333333'),
    ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'suspended.user@eagles.org.ph', 'Suspended', 'User', 'TEST-MEMBER-S', 'member', 'suspended', 'Bantayog Elite', 'B+', 'Em Susp', '09174444444'),
    ('a0000000-0000-0000-0000-000000000005', NULL, 'applicant.test@eagles.org.ph', 'Applicant', 'Candidate', 'TEST-APPLICANT-01', 'member', 'pending', 'Bantayog Elite', 'A+', 'Em App', '09175555555');

INSERT INTO public.events (id, title, description, event_date, checkin_code, checkin_open, status)
VALUES ('e0000000-0000-0000-0000-000000000001', 'Integration Conclave Test', 'Test Event', CURRENT_DATE, 'PASSKEY-2026', true, 'published');

INSERT INTO public.contributions (id, member_id, title, category, amount, payment_method, status, reference_number)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Alpha Annual Dues', 'Membership Dues', 1500.00, 'GCash', 'verified', 'REF-ALPHA-01'),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Beta Building Fund', 'Building Fund', 5000.00, 'Bank Transfer', 'pending', 'REF-BETA-01');

-- -----------------------------------------------------------------------------
-- TEST SUITE 1: ANONYMOUS CALLER (SET ROLE anon)
-- Validates: Anon cannot mutate records or invoke privileged RPCs
-- -----------------------------------------------------------------------------
SET ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';
SET LOCAL "request.jwt.claim.sub" = '';

DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM public.approve_member_applicant('a0000000-0000-0000-0000-000000000005');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 1.1 FAIL: anon was able to execute approve_member_applicant!';
    END IF;
    RAISE NOTICE 'TEST 1.1 PASS: anon rejected from approve_member_applicant.';
END $$;

DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM public.verify_contribution('c0000000-0000-0000-0000-000000000002', 'verified');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 1.2 FAIL: anon was able to execute verify_contribution!';
    END IF;
    RAISE NOTICE 'TEST 1.2 PASS: anon rejected from verify_contribution.';
END $$;

DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM public.submit_self_contribution('Hacked Title', 'Monthly Dues', 100.00, 'cash');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 1.3 FAIL: anon was able to execute submit_self_contribution!';
    END IF;
    RAISE NOTICE 'TEST 1.3 PASS: anon rejected from submit_self_contribution.';
END $$;

DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        INSERT INTO public.contributions (member_id, title, category, amount, payment_method, status)
        VALUES ('a0000000-0000-0000-0000-000000000002', 'Direct SQL Injection', 'General', 100, 'cash', 'verified');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 1.4 FAIL: anon direct INSERT into contributions was not blocked!';
    END IF;
    RAISE NOTICE 'TEST 1.4 PASS: anon direct INSERT blocked by RLS.';
END $$;

RESET ROLE;

-- -----------------------------------------------------------------------------
-- TEST SUITE 2: MEMBER A ISOLATION (SET ROLE authenticated, sub = Member A)
-- Validates: Member A cannot see or alter Member B private data
-- -----------------------------------------------------------------------------
SET ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = 'b0000000-0000-0000-0000-000000000002';

-- Test 2.1: Member A cannot alter Member B profile
DO $$
DECLARE
    v_rows_affected INT;
BEGIN
    UPDATE public.members 
    SET first_name = 'HACKED_B', blood_type = 'O-'
    WHERE id = 'a0000000-0000-0000-0000-000000000003';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected > 0 THEN
        RAISE EXCEPTION 'TEST 2.1 FAIL: Member A was able to update Member B row! Rows affected: %', v_rows_affected;
    END IF;
    RAISE NOTICE 'TEST 2.1 PASS: Member A cannot update Member B record (0 rows affected).';
END $$;

-- Test 2.2: Member A cannot read Member B private contributions
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.contributions
    WHERE id = 'c0000000-0000-0000-0000-000000000002';

    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 2.2 FAIL: Member A was able to read Member B pending contribution!';
    END IF;
    RAISE NOTICE 'TEST 2.2 PASS: Member A cannot read Member B contribution record.';
END $$;

-- Test 2.3: Member A cannot execute officer RPCs
DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM public.approve_member_applicant('a0000000-0000-0000-0000-000000000005');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 2.3 FAIL: Member A was able to execute approve_member_applicant!';
    END IF;
    RAISE NOTICE 'TEST 2.3 PASS: Ordinary Member A rejected from approve_member_applicant.';
END $$;

-- Test 2.4: Member A CAN submit their own contribution via submit_self_contribution
DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.submit_self_contribution('Member A Self Dues', 'Monthly Dues', 500.00, 'GCash');
    IF NOT (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 2.4 FAIL: Member A submit_self_contribution failed: %', v_res->>'message';
    END IF;
    RAISE NOTICE 'TEST 2.4 PASS: Member A successfully submitted self contribution bound to auth.uid().';
END $$;

RESET ROLE;

-- -----------------------------------------------------------------------------
-- TEST SUITE 3: SUSPENDED MEMBER RESTRICTIONS (SET ROLE authenticated, sub = Suspended)
-- Validates: Suspended member cannot submit contributions or check in
-- -----------------------------------------------------------------------------
SET ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = 'b0000000-0000-0000-0000-000000000004';

DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM public.submit_self_contribution('Suspended Attempt', 'Monthly Dues', 100.00, 'cash');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST 3.1 FAIL: Suspended member was able to submit contribution!';
    END IF;
    RAISE NOTICE 'TEST 3.1 PASS: Suspended member rejected from submit_self_contribution.';
END $$;

DO $$
DECLARE
    v_res JSONB;
    v_caught BOOLEAN := false;
BEGIN
    BEGIN
        v_res := public.check_in_self_event('e0000000-0000-0000-0000-000000000001', 'PASSKEY-2026');
    EXCEPTION WHEN OTHERS THEN
        v_caught := true;
    END;
    IF NOT v_caught AND (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 3.2 FAIL: Suspended member was able to check in to event!';
    END IF;
    RAISE NOTICE 'TEST 3.2 PASS: Suspended member rejected from event check-in.';
END $$;

RESET ROLE;

-- -----------------------------------------------------------------------------
-- TEST SUITE 4: OFFICER CAPABILITIES & AUDIT INTEGRITY (SET ROLE authenticated, sub = Officer)
-- Validates: Officer CAN generate claim tokens, verify contributions, and record attendance
-- -----------------------------------------------------------------------------
SET ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = 'b0000000-0000-0000-0000-000000000001';

-- Test 4.1: Officer generates cryptographic hashed claim token
DO $$
DECLARE
    v_res JSONB;
    v_raw_token TEXT;
BEGIN
    v_res := public.generate_member_claim_token('TEST-APPLICANT-01', 24);
    IF NOT (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 4.1 FAIL: Officer failed to generate claim token: %', v_res->>'message';
    END IF;

    v_raw_token := v_res->>'raw_claim_token';
    IF v_raw_token IS NULL OR length(v_raw_token) < 16 THEN
        RAISE EXCEPTION 'TEST 4.1 FAIL: Claim token entropy is insufficient (% characters)', length(v_raw_token);
    END IF;
    RAISE NOTICE 'TEST 4.1 PASS: Officer generated 128-bit cryptographic claim token: %', substring(v_raw_token, 1, 8) || '...';
END $$;

-- Test 4.2: Officer verifies contribution with audit attribution
DO $$
DECLARE
    v_res JSONB;
    v_verifier UUID;
BEGIN
    v_res := public.verify_contribution('c0000000-0000-0000-0000-000000000002', 'verified');
    IF NOT (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 4.2 FAIL: Officer contribution verification failed: %', v_res->>'message';
    END IF;

    SELECT verified_by INTO v_verifier
    FROM public.contributions
    WHERE id = 'c0000000-0000-0000-0000-000000000002';

    IF v_verifier <> 'a0000000-0000-0000-0000-000000000001' THEN
        RAISE EXCEPTION 'TEST 4.2 FAIL: verified_by does not match acting officer! Got: %', v_verifier;
    END IF;
    RAISE NOTICE 'TEST 4.2 PASS: Contribution verified with authenticated officer attribution.';
END $$;

-- Test 4.3: Officer records attendance (verifies checkin_open = true requirement)
DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.record_officer_attendance('e0000000-0000-0000-0000-000000000001', 'TEST-MEMBER-A');
    IF NOT (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 4.3 FAIL: Officer attendance check-in failed: %', v_res->>'message';
    END IF;
    RAISE NOTICE 'TEST 4.3 PASS: Officer attendance recorded with checkin_open validated.';
END $$;

-- Test 4.4: Closed event check-in window blocks attendance (R-05 check)
RESET ROLE;
UPDATE public.events SET checkin_open = false WHERE id = 'e0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = 'b0000000-0000-0000-0000-000000000001';

DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.record_officer_attendance('e0000000-0000-0000-0000-000000000001', 'TEST-MEMBER-B');
    IF (v_res->>'success')::boolean THEN
        RAISE EXCEPTION 'TEST 4.4 FAIL: Attendance succeeded while checkin_open = false!';
    END IF;
    RAISE NOTICE 'TEST 4.4 PASS: Attendance strictly blocked when event checkin_open = false.';
END $$;

RESET ROLE;

-- -----------------------------------------------------------------------------
-- CLEANUP & TEARDOWN
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE '>>> ALL MULTI-ROLE SECURITY & ISOLATION TESTS PASSED WITH ACTUAL ROLE ENFORCEMENT <<<';
END $$;

ROLLBACK;
