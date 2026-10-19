-- =============================================================================
-- Migration: 20261019000008_security_gate_final_hardening.sql
-- Description: Final Production Security Gate Hardening
--   1. Eliminate anonymous/public access to legacy & privileged functions:
--      - auto_confirm_user_email() [DROP trigger & function]
--      - current_member() [REVOKE ALL from PUBLIC, anon; DROP obsolete function]
--      - handle_new_user() [REVOKE ALL from PUBLIC, anon, authenticated; preserve trigger]
--      - rls_auto_enable() [DROP if event trigger/function; REVOKE ALL]
--   2. Enforce ALTER DEFAULT PRIVILEGES in public schema:
--      - Revoke default EXECUTE on functions from PUBLIC and anon
--   3. Function Search Path Hardening:
--      - Recreate update_timestamp() with SET search_path = public
--      - Dynamically enforce SET search_path = public on all functions in public schema
--   4. Blanket Revoke on all SECURITY DEFINER functions from PUBLIC & anon:
--      - Grant EXECUTE only to authenticated on explicit application whitelist
--   5. Dedicated Non-Sensitive Test Fixtures for Zero-Impact Security Verification:
--      - public.members fixture: 'FIXTURE-SECURITY-PROBE'
--      - storage.objects fixture: 'fixtures/probe.txt' in receipts and member-ids
--   6. Version Tracking:
--      - Record 20261019000008 in schema_migrations
-- =============================================================================

-- =============================================================================
-- 1. Correct Anonymous & Public Grants on Legacy Privileged Functions
-- =============================================================================

-- 1.1 auto_confirm_user_email(): Drop obsolete email verification bypass trigger & function
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'auto_confirm_user_email'
    ) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.argtypes);
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- 1.2 current_member(): Revoke from PUBLIC & anon, and drop obsolete helper
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'current_member'
    ) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.argtypes);
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- 1.3 handle_new_user(): Preserve signup trigger, but REVOKE direct execution from all client roles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    ) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- 1.4 rls_auto_enable(): Drop any stray event trigger/function and revoke execution
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'rls_auto_enable_trigger') THEN
        DROP EVENT TRIGGER rls_auto_enable_trigger;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
    ) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.argtypes);
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- =============================================================================
-- 2. Prevent Future Privilege Leaks: Alter Default Function Privileges
-- =============================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- =============================================================================
-- 3. Resolve Function Search Path Warnings Across All Public Functions
-- =============================================================================

-- Recreate update_timestamp() with explicit search_path
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Revoke execute from public/anon on trigger function update_timestamp
REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC, anon, authenticated;

-- Dynamically enforce SET search_path = public on every remaining function in schema public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (p.proconfig IS NULL OR NOT EXISTS (
              SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
          ))
    ) LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- =============================================================================
-- 4. Blanket Revoke on ALL SECURITY DEFINER Functions from PUBLIC and anon
-- =============================================================================
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
    ) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon;', func.proname, func.argtypes);
    END LOOP;
END $$;

-- Grant EXECUTE only to authenticated for legitimate application RPCs
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'is_active_member', 'is_officer', 'is_admin',
              'check_in_event', 'approve_member_applicant',
              'submit_member_contribution', 'verify_contribution',
              'record_officer_attendance', 'update_member_official_id',
              'update_member_profile', 'claim_member_account',
              'generate_member_claim_token', 'get_financial_ledger_summary',
              'submit_self_contribution', 'update_self_profile',
              'update_self_official_id', 'check_in_self_event',
              'officer_submit_contribution_for_member', 'officer_update_member_profile'
          )
    ) LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated;', func.proname, func.argtypes);
    END LOOP;
END $$;

-- =============================================================================
-- 5. Dedicated Non-Sensitive Fixtures for Zero-Impact Security Verification
-- =============================================================================

-- 5.1 Member Fixtures for State Integrity Probing (Never mutate real members)
INSERT INTO public.members (
    email,
    first_name,
    last_name,
    member_number,
    role,
    membership_status
) VALUES 
    ('security.probe@eagles.internal', 'Probe', 'Fixture', 'FIXTURE-SECURITY-PROBE', 'member', 'active'),
    ('suspended.probe@eagles.internal', 'Suspended', 'Fixture', 'FIXTURE-SUSPENDED-PROBE', 'member', 'suspended'),
    ('applicant.probe@eagles.internal', 'Applicant', 'Fixture', 'FIXTURE-APPLICANT-PROBE', 'member', 'pending')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role,
    membership_status = EXCLUDED.membership_status,
    member_number = EXCLUDED.member_number;

-- 5.2 Storage Object Fixtures: Verify real file access control (not nonexistent 404s)
INSERT INTO storage.objects (id, bucket_id, name, owner, metadata)
VALUES 
    (gen_random_uuid(), 'member-ids', 'fixtures/probe.txt', NULL, '{"mimetype": "text/plain", "size": 19}'::jsonb),
    (gen_random_uuid(), 'receipts', 'fixtures/probe.txt', NULL, '{"mimetype": "text/plain", "size": 19}'::jsonb)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- =============================================================================
-- 6. Schema Migrations Version Tracking
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) THEN
        INSERT INTO supabase_migrations.schema_migrations (version)
        VALUES ('20261019000008')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;
