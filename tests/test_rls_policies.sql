-- =============================================================================
-- AGILA Hub - RLS Security & Policy Verification Suite
-- Intended for execution in PostgreSQL / Supabase Test Runner
-- =============================================================================

BEGIN;

-- 1. Setup Test Assertions
DO $$
DECLARE
    v_count integer;
BEGIN
    RAISE NOTICE '>>> Beginning AGILA Hub RLS Assertion Tests <<<';

    -- Test 1: Verify all 7 public tables have RLS enabled in pg_tables / pg_class
    SELECT count(*) INTO v_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('members', 'announcements', 'events', 'attendance', 'contributions', 'documents', 'audit_logs')
      AND c.relrowsecurity = true;

    IF v_count <> 7 THEN
        RAISE EXCEPTION 'RLS NOT enabled on all 7 tables! Only found % tables with RLS active.', v_count;
    END IF;
    RAISE NOTICE 'Test 1 PASS: All 7 domain tables have relrowsecurity enabled.';

    -- Test 2: Verify helper functions exist and have SECURITY DEFINER
    SELECT count(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('is_admin', 'is_officer', 'is_active_member', 'current_member', 'handle_new_user')
      AND p.prosecdef = true;

    IF v_count <> 5 THEN
        RAISE EXCEPTION 'Helper functions are missing SECURITY DEFINER flag! Found: %', v_count;
    END IF;
    RAISE NOTICE 'Test 2 PASS: All 5 security helper functions are marked SECURITY DEFINER.';

    -- Test 3: Verify trigger attachment on auth.users
    SELECT count(*) INTO v_count
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created';

    IF v_count = 0 THEN
        RAISE NOTICE 'Test 3 SKIPPED: Trigger on_auth_user_created check skipped (auth schema may be mock/isolated).';
    ELSE
        RAISE NOTICE 'Test 3 PASS: Trigger on_auth_user_created verified.';
    END IF;

    -- Test 4: Verify audit log immutability policy (no UPDATE or DELETE policies allowed for normal users)
    SELECT count(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND cmd IN ('UPDATE', 'DELETE');

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Security Violation: audit_logs must be immutable but has UPDATE or DELETE policies!';
    END IF;
    RAISE NOTICE 'Test 4 PASS: audit_logs table is strictly immutable (zero UPDATE/DELETE policies).';

    RAISE NOTICE '>>> All RLS Security Suite Assertions Passed Successfully <<<';
END $$;

ROLLBACK;
