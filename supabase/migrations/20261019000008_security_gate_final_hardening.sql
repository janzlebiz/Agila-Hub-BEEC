-- =============================================================================
-- Migration: 20261019000008_security_gate_final_hardening.sql
-- Description: Final Production Security Gate Hardening (Strict Fail-Closed)
--   1. Eliminate anonymous/public access to legacy & privileged functions:
--      - auto_confirm_user_email() [DROP trigger & function]
--      - current_member() [REVOKE ALL from PUBLIC, anon; DROP obsolete function]
--      - handle_new_user() [REVOKE ALL from PUBLIC, anon, authenticated; preserve trigger]
--      - rls_auto_enable() [DROP event trigger if exists; REVOKE ALL; DROP function]
--   2. Schema-Level Isolation & Default Privilege Hardening:
--      - REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated
--      - ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon
--   3. Function Search Path & Ownership Hardening:
--      - Minimal trusted search paths (public, extensions, pg_temp vs public, pg_temp)
--      - Enforce postgres ownership across all public schema functions
--   4. Blanket Revoke on all SECURITY DEFINER functions from PUBLIC & anon:
--      - Grant EXECUTE only to authenticated on explicit application whitelist
--   5. Dedicated Non-Sensitive Member Test Fixtures (Strict fail-closed without error masking):
--      - public.members fixture: 'FIXTURE-SECURITY-PROBE', 'FIXTURE-SUSPENDED-PROBE'
--   6. Schema Migrations Version Tracking:
--      - Record 20261019000008 in schema_migrations without silent error suppression
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

-- 1.3 handle_new_user(): Preserve signup trigger on auth.users, but REVOKE direct execution from all client roles
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

-- 1.4 rls_auto_enable(): Drop any event trigger and obsolete function (fail-closed, no masked errors)
DROP EVENT TRIGGER IF EXISTS rls_auto_enable_trigger;

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
-- 2. Schema-Level Isolation & Default Privilege Hardening
-- =============================================================================

-- Prevent search-path hijacking: Non-superusers cannot create or replace objects in public
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;

-- Prevent future privilege leaks on newly created functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- =============================================================================
-- 3. Resolve Function Search Path & Ownership Hardening
-- =============================================================================

-- 3.1 Recreate update_timestamp() with explicit minimal trusted search_path
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC, anon, authenticated;

-- 3.2 Enforce postgres ownership across all public schema functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO postgres;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- 3.3 Set minimal trusted search path for functions requiring extensions (pgcrypto)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('generate_member_claim_token', 'claim_member_account')
    ) LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, extensions, pg_temp;', r.proname, r.argtypes);
    END LOOP;
END $$;

-- 3.4 Set minimal trusted search path (public, pg_temp) on all other public functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) AS argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname NOT IN ('generate_member_claim_token', 'claim_member_account')
    ) LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp;', r.proname, r.argtypes);
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
-- 5. Dedicated Non-Sensitive Fixtures (Fail-Closed, No Error Masking)
-- =============================================================================

-- 5.1 Member Fixtures for State Integrity Probing (Never mutate real members)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE member_number = 'FIXTURE-SECURITY-PROBE') THEN
        INSERT INTO public.members (email, first_name, last_name, member_number, role, membership_status)
        VALUES ('security.probe@eagles.internal', 'Probe', 'Fixture', 'FIXTURE-SECURITY-PROBE', 'member', 'active');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE member_number = 'FIXTURE-SUSPENDED-PROBE') THEN
        INSERT INTO public.members (email, first_name, last_name, member_number, role, membership_status)
        VALUES ('suspended.probe@eagles.internal', 'Suspended', 'Fixture', 'FIXTURE-SUSPENDED-PROBE', 'member', 'suspended');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE member_number = 'FIXTURE-APPLICANT-PROBE') THEN
        INSERT INTO public.members (email, first_name, last_name, member_number, role, membership_status)
        VALUES ('applicant.probe@eagles.internal', 'Applicant', 'Fixture', 'FIXTURE-APPLICANT-PROBE', 'member', 'pending');
    END IF;
END $$;

-- =============================================================================
-- 6. Schema Migrations Version Tracking (Fail-Closed)
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261019000008') THEN
            INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20261019000008');
        END IF;
    END IF;
END $$;
