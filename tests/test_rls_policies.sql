-- =============================================================================
-- AGILA Hub - Multi-Role RLS Security & Adversarial Authorization Test Suite
-- Intended for execution in PostgreSQL / Supabase Test Runner
-- Validates: Anonymous, Ordinary Member, Suspended Member, and Officer Permissions
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_count integer;
    v_admin_uid UUID := gen_random_uuid();
    v_officer_uid UUID := gen_random_uuid();
    v_member_a_uid UUID := gen_random_uuid();
    v_member_b_uid UUID := gen_random_uuid();
    v_suspended_uid UUID := gen_random_uuid();

    v_admin_id UUID;
    v_officer_id UUID;
    v_member_a_id UUID;
    v_member_b_id UUID;
    v_suspended_id UUID;

    v_event_id UUID;
    v_contrib_a_id UUID;
    v_contrib_b_id UUID;
    v_claim_token TEXT := 'TEST-CLAIM-9999';

    v_result JSONB;
    v_caught_exception BOOLEAN;
BEGIN
    RAISE NOTICE '>>> STARTING AGILA HUB ADVERSARIAL SECURITY & ISOLATION TEST SUITE <<<';

    -- -------------------------------------------------------------------------
    -- TEST 1: Structural Table Protection & RLS Activation
    -- -------------------------------------------------------------------------
    SELECT count(*) INTO v_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('members', 'announcements', 'events', 'attendance', 'contributions', 'documents', 'audit_logs', 'member_claim_tokens')
      AND c.relrowsecurity = true;

    IF v_count < 8 THEN
        RAISE EXCEPTION 'Test 1 FAIL: Relrowsecurity is not enabled on all domain tables! Found % active.', v_count;
    END IF;
    RAISE NOTICE 'Test 1 PASS: All 8 core tables have Row Level Security strictly enabled.';

    -- -------------------------------------------------------------------------
    -- TEST 2: Verify Blanket Policies Removed (No Permissive "USING (true)")
    -- -------------------------------------------------------------------------
    SELECT count(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('members', 'contributions')
      AND qual = 'true'
      AND cmd = 'SELECT';

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Test 2 FAIL: Found % blanket USING (true) SELECT policies remaining on sensitive tables!', v_count;
    END IF;
    RAISE NOTICE 'Test 2 PASS: Zero blanket USING (true) SELECT policies detected.';

    -- -------------------------------------------------------------------------
    -- TEST 3: Seed Synthetic Test Personas & Records
    -- -------------------------------------------------------------------------
    -- 3.1 Admin Officer
    INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status)
    VALUES (v_officer_uid, 'officer.test@eagles.org.ph', 'Kuya', 'Officer', 'TEST-OFFICER-01', 'officer', 'active')
    RETURNING id INTO v_officer_id;

    -- 3.2 Ordinary Member A
    INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, blood_type, emergency_contact_name, emergency_contact_phone)
    VALUES (v_member_a_uid, 'member.a@eagles.org.ph', 'Juan', 'Alpha', 'TEST-MEMBER-A', 'member', 'active', 'O+', 'Emergency Alpha', '09170000001')
    RETURNING id INTO v_member_a_id;

    -- 3.3 Ordinary Member B
    INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, blood_type, emergency_contact_name, emergency_contact_phone)
    VALUES (v_member_b_uid, 'member.b@eagles.org.ph', 'Pedro', 'Beta', 'TEST-MEMBER-B', 'member', 'active', 'AB+', 'Emergency Beta', '09170000002')
    RETURNING id INTO v_member_b_id;

    -- 3.4 Suspended Member
    INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status)
    VALUES (v_suspended_uid, 'suspended.user@eagles.org.ph', 'Suspended', 'User', 'TEST-MEMBER-S', 'member', 'suspended')
    RETURNING id INTO v_suspended_id;

    -- 3.5 Test Event
    INSERT INTO public.events (title, description, event_date, checkin_code, checkin_open, status)
    VALUES ('National Executive Conclave', 'Official meeting', CURRENT_DATE, 'CONCLAVE-2026', true, 'published')
    RETURNING id INTO v_event_id;

    -- 3.6 Contributions for Member A and B
    INSERT INTO public.contributions (member_id, title, category, amount, payment_method, status, reference_number)
    VALUES (v_member_a_id, 'Monthly Dues Q1', 'Monthly Dues', 1000.00, 'GCash', 'verified', 'REF-ALPHA-001')
    RETURNING id INTO v_contrib_a_id;

    INSERT INTO public.contributions (member_id, title, category, amount, payment_method, status, reference_number)
    VALUES (v_member_b_id, 'Building Fund Pledges', 'Building Fund', 5000.00, 'Bank Transfer', 'pending', 'REF-BETA-001')
    RETURNING id INTO v_contrib_b_id;

    RAISE NOTICE 'Test 3 PASS: Test personas and records initialized.';

    -- -------------------------------------------------------------------------
    -- TEST 4: Anonymous Caller Privileges Check (Must Reject Mutating Operations)
    -- -------------------------------------------------------------------------
    -- Simulate Anonymous Role (auth.uid() = NULL)
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);

    -- 4.1 Anonymous cannot approve applicant
    v_caught_exception := false;
    BEGIN
        PERFORM public.approve_member_applicant(v_member_b_id);
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 4.1 FAIL: Anonymous caller was able to invoke approve_member_applicant!';
    END IF;
    RAISE NOTICE 'Test 4.1 PASS: Anonymous caller rejected from approve_member_applicant.';

    -- 4.2 Anonymous cannot verify contributions
    v_caught_exception := false;
    BEGIN
        PERFORM public.verify_contribution(v_contrib_b_id, 'verified');
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 4.2 FAIL: Anonymous caller was able to invoke verify_contribution!';
    END IF;
    RAISE NOTICE 'Test 4.2 PASS: Anonymous caller rejected from verify_contribution.';

    -- 4.3 Anonymous cannot check in to events
    v_result := public.check_in_event(v_event_id, 'CONCLAVE-2026');
    IF (v_result->>'success')::boolean = true THEN
        RAISE EXCEPTION 'Test 4.3 FAIL: Anonymous caller was able to check in to event!';
    END IF;
    RAISE NOTICE 'Test 4.3 PASS: Anonymous caller check-in rejected without session.';

    -- 4.4 Anonymous cannot record officer attendance
    v_caught_exception := false;
    BEGIN
        PERFORM public.record_officer_attendance(v_event_id, 'TEST-MEMBER-A');
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 4.4 FAIL: Anonymous caller was able to record officer attendance!';
    END IF;
    RAISE NOTICE 'Test 4.4 PASS: Anonymous caller rejected from record_officer_attendance.';

    -- 4.5 Anonymous cannot update member profile
    v_caught_exception := false;
    BEGIN
        PERFORM public.update_member_profile(v_member_a_id, 'Hacked', 'Name');
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 4.5 FAIL: Anonymous caller was able to update member profile!';
    END IF;
    RAISE NOTICE 'Test 4.5 PASS: Anonymous caller rejected from update_member_profile.';

    -- -------------------------------------------------------------------------
    -- TEST 5: Cross-Member Isolation (Member A cannot alter Member B)
    -- -------------------------------------------------------------------------
    -- Switch context to Ordinary Member A
    PERFORM set_config('request.jwt.claim.sub', v_member_a_uid::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- 5.1 Member A cannot verify Member B's contribution
    v_caught_exception := false;
    BEGIN
        PERFORM public.verify_contribution(v_contrib_b_id, 'verified');
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 5.1 FAIL: Ordinary Member A was able to verify Member B contribution!';
    END IF;
    RAISE NOTICE 'Test 5.1 PASS: Ordinary Member A forbidden from financial verification.';

    -- 5.2 Member A cannot approve applicant
    v_caught_exception := false;
    BEGIN
        PERFORM public.approve_member_applicant(v_member_b_id);
    EXCEPTION WHEN OTHERS THEN
        v_caught_exception := true;
    END;
    IF NOT v_caught_exception THEN
        RAISE EXCEPTION 'Test 5.2 FAIL: Ordinary Member A was able to approve member applicant!';
    END IF;
    RAISE NOTICE 'Test 5.2 PASS: Ordinary Member A forbidden from applicant approvals.';

    -- 5.3 Member A updating profile updates ONLY Member A, even if Member B's ID is passed
    v_result := public.update_member_profile(v_member_b_id, 'JuanUpdated', 'AlphaUpdated');
    IF (v_result->>'success')::boolean != true THEN
        RAISE EXCEPTION 'Test 5.3 FAIL: Member A profile update failed!';
    END IF;

    -- Verify Member B profile was UNTOUCHED
    SELECT first_name INTO v_result FROM public.members WHERE id = v_member_b_id;
    IF (v_result#>>'{}') = 'JuanUpdated' THEN
        RAISE EXCEPTION 'Test 5.3 CRITICAL FAIL: Member A was able to overwrite Member B profile!';
    END IF;
    RAISE NOTICE 'Test 5.3 PASS: Member A cannot alter Member B profile (operation scoped to caller).';

    -- -------------------------------------------------------------------------
    -- TEST 6: Suspended Member Restriction
    -- -------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claim.sub', v_suspended_uid::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    v_result := public.check_in_event(v_event_id, 'CONCLAVE-2026');
    IF (v_result->>'success')::boolean = true THEN
        RAISE EXCEPTION 'Test 6 FAIL: Suspended member was able to check in to assembly!';
    END IF;
    RAISE NOTICE 'Test 6 PASS: Suspended member barred from assembly check-in.';

    -- -------------------------------------------------------------------------
    -- TEST 7: Authorized Officer Execution & Audit Attribution
    -- -------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claim.sub', v_officer_uid::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- 7.1 Officer verifies Member B contribution
    v_result := public.verify_contribution(v_contrib_b_id, 'verified', NULL);
    IF (v_result->>'success')::boolean != true THEN
        RAISE EXCEPTION 'Test 7.1 FAIL: Authorized officer failed to verify contribution: %', v_result;
    END IF;

    -- Verify contribution status changed to 'verified' and verified_by matches officer
    SELECT verified_by INTO v_result FROM public.contributions WHERE id = v_contrib_b_id AND status = 'verified';
    IF (v_result#>>'{}')::UUID != v_officer_id THEN
        RAISE EXCEPTION 'Test 7.1 FAIL: verified_by does not match authenticated officer!';
    END IF;
    RAISE NOTICE 'Test 7.1 PASS: Officer successfully verified contribution and verified_by was derived from session.';

    -- 7.2 Verify Audit Log actor matches officer, not caller spoof
    SELECT actor_id INTO v_result 
    FROM public.audit_logs 
    WHERE target_id = v_contrib_b_id AND action = 'VERIFY_CONTRIBUTION' 
    ORDER BY created_at DESC LIMIT 1;

    IF (v_result#>>'{}')::UUID != v_officer_id THEN
        RAISE EXCEPTION 'Test 7.2 FAIL: Audit log actor_id % does not match authenticated officer %!', v_result, v_officer_id;
    END IF;
    RAISE NOTICE 'Test 7.2 PASS: Audit log attributed strictly to authenticated officer.';

    RAISE NOTICE '>>> ALL 7 MULTI-ROLE SECURITY & AUTHORIZATION TESTS PASSED PERFECTLY <<<';
END $$;

ROLLBACK;
