-- =============================================================================
-- Migration: 20261019000006_security_audit_remediation.sql
-- Description: Comprehensive Remediation for Security Audit Findings F-01 to F-08
-- =============================================================================

-- =============================================================================
-- 1. F-07: Remove Auto-Confirm Trigger on auth.users & Email Bypass
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user_email();

-- Update handle_new_user() signup trigger to stop automatic unverified account linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Do NOT automatically link user_id to pre-registered members by unverified email match.
    -- Account linking must occur through verified atomic claim token (claim_member_account).
    -- New direct signups create a member applicant in 'pending' status.
    INSERT INTO public.members (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        membership_status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        'member',
        'pending'
    )
    ON CONFLICT (email) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 2. F-08: Token-Based Member Claiming Architecture
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.member_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    token_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.members(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    consumed_at TIMESTAMPTZ,
    consumed_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.member_claim_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Officers manage claim tokens" ON public.member_claim_tokens;
    CREATE POLICY "Officers manage claim tokens"
        ON public.member_claim_tokens FOR ALL
        TO authenticated
        USING (public.is_officer());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION public.claim_member_account(
    p_member_number TEXT,
    p_claim_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_member RECORD;
    v_token RECORD;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required to claim member profile.');
    END IF;

    -- Check if user already linked to a member
    IF EXISTS (SELECT 1 FROM public.members WHERE user_id = v_auth_uid) THEN
        RETURN jsonb_build_object('success', false, 'message', 'This authenticated account is already linked to an active member profile.');
    END IF;

    -- Find target member by member_number
    SELECT id, first_name, last_name, user_id, membership_status, member_number
    INTO v_member
    FROM public.members
    WHERE UPPER(TRIM(member_number)) = UPPER(TRIM(p_member_number));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Membership ID not found in chapter registry.');
    END IF;

    IF v_member.user_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'This membership ID has already been claimed.');
    END IF;

    -- Validate claim token
    SELECT id, expires_at, consumed_at
    INTO v_token
    FROM public.member_claim_tokens
    WHERE member_id = v_member.id
      AND token_code = TRIM(p_claim_token)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid one-time claim token for this membership ID.');
    END IF;

    IF v_token.consumed_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Claim token has already been consumed.');
    END IF;

    IF v_token.expires_at < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Claim token has expired. Please contact chapter Secretariat for a fresh token.');
    END IF;

    -- Atomically link account
    UPDATE public.members
    SET user_id = v_auth_uid,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_member.id AND user_id IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conflict detected during account claim. Please retry.');
    END IF;

    -- Mark token consumed
    UPDATE public.member_claim_tokens
    SET consumed_at = timezone('utc'::text, now()),
        consumed_by_user_id = v_auth_uid
    WHERE id = v_token.id;

    -- Non-repudiation audit logging
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_member.id,
        'CLAIM_MEMBER_ACCOUNT',
        'members',
        v_member.id,
        jsonb_build_object('user_id', v_auth_uid, 'claimed_at', now(), 'token_id', v_token.id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Membership successfully claimed! Welcome Kuya/Ate ' || v_member.first_name || '.',
        'member_id', v_member.id,
        'member_number', v_member.member_number
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_member_account FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_member_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_member_account TO authenticated;

-- NOTE: Shared demo claim token seeds are prohibited.
-- Claim tokens must be generated on-demand by authorized officers via generate_member_claim_token().

-- =============================================================================
-- 3. F-01: Secure Applicant Approval RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.approve_member_applicant(
    p_member_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_approver_id UUID;
    v_target_status membership_status;
BEGIN
    -- 1. Authentication check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- 2. Verify caller has active officer or admin role
    SELECT id INTO v_approver_id 
    FROM public.members 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_approver_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can approve member applications.';
    END IF;

    -- 3. Validate target applicant
    SELECT membership_status INTO v_target_status
    FROM public.members
    WHERE id = p_member_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Applicant record not found.');
    END IF;

    IF v_target_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Target member application is not in pending status (' || v_target_status || ').');
    END IF;

    -- 4. Execute atomic update
    UPDATE public.members
    SET membership_status = 'active',
        approved_by = v_approver_id,
        approved_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_member_id AND membership_status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No pending records were updated.');
    END IF;

    -- 5. Audit Log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_approver_id,
        'APPROVE_MEMBER_APPLICANT',
        'members',
        p_member_id,
        jsonb_build_object('approved_by', v_approver_id, 'approved_at', now())
    );

    RETURN jsonb_build_object('success', true, 'message', 'Member application approved and activated.');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_member_applicant(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_member_applicant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_member_applicant(UUID) TO authenticated;

-- =============================================================================
-- 4. F-02: Server-Side Financial Contribution Verification RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.verify_contribution(
    p_contribution_id UUID,
    p_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL,
    p_verified_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_officer_id UUID;
    v_existing_status contribution_status;
    v_amount NUMERIC;
BEGIN
    -- 1. Authentication check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- 2. Derive authorized officer from authenticated session (ignore caller parameter)
    SELECT id INTO v_officer_id 
    FROM public.members 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can verify financial contributions.';
    END IF;

    -- 3. Validate status transition
    IF p_status NOT IN ('verified', 'rejected') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid status transition. Status must be verified or rejected.');
    END IF;

    -- 4. Validate existing contribution record
    SELECT status, amount INTO v_existing_status, v_amount
    FROM public.contributions
    WHERE id = p_contribution_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contribution record not found.');
    END IF;

    IF v_existing_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contribution is already processed (' || v_existing_status || ').');
    END IF;

    -- 5. Update record
    UPDATE public.contributions
    SET status = p_status::contribution_status,
        rejection_reason = p_rejection_reason,
        verified_by = v_officer_id,
        verified_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_contribution_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Failed to update contribution status.');
    END IF;

    -- 6. Audit log with real authenticated actor
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_officer_id,
        'VERIFY_CONTRIBUTION',
        'contributions',
        p_contribution_id,
        jsonb_build_object('status', p_status, 'amount', v_amount, 'verified_by', v_officer_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Contribution marked as ' || p_status || '.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) TO authenticated;

-- =============================================================================
-- 5. F-03: Restrict Member & Contribution Table Visibility (No Blanket True)
-- =============================================================================
DROP POLICY IF EXISTS "Allow authenticated read members" ON public.members;
DROP POLICY IF EXISTS "Members view approved directory" ON public.members;
DROP POLICY IF EXISTS "Allow authenticated read contributions" ON public.contributions;
DROP POLICY IF EXISTS "Members view own contributions, officers view all" ON public.contributions;
DROP POLICY IF EXISTS "Public view verified contributions" ON public.contributions;
DROP POLICY IF EXISTS "Members view directory or self" ON public.members;

-- Strict RLS on contributions: Authenticated users view own; officers view all
CREATE POLICY "Strict contributions visibility"
    ON public.contributions FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

-- Strict RLS on members: Active members view active members directory; users view self; officers view all
CREATE POLICY "Strict members visibility"
    ON public.members FOR SELECT
    TO authenticated
    USING (
        (public.is_active_member() AND membership_status = 'active')
        OR user_id = auth.uid()
        OR public.is_officer()
    );

-- Safe summary RPC for public / unauthenticated overview
CREATE OR REPLACE FUNCTION public.get_financial_ledger_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_collected NUMERIC;
    v_verified_count INT;
    v_pending_count INT;
BEGIN
    SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0),
        COUNT(*) FILTER (WHERE status = 'verified'),
        COUNT(*) FILTER (WHERE status = 'pending')
    INTO v_total_collected, v_verified_count, v_pending_count
    FROM public.contributions;

    RETURN jsonb_build_object(
        'total_collected', v_total_collected,
        'verified_count', v_verified_count,
        'pending_count', v_pending_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_ledger_summary() TO anon, authenticated;

-- =============================================================================
-- 6. F-04: Secure Privileged RPCs & Remove Arbitrary Caller IDs / Fallbacks
-- =============================================================================

-- 6.1 submit_member_contribution: Derive member from authenticated session
CREATE OR REPLACE FUNCTION public.submit_member_contribution(
    p_member_id UUID,
    p_title TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT,
    p_proof_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_member_id UUID;
    v_caller_role user_role;
    v_target_member_id UUID;
    v_contrib_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Resolve caller identity
    SELECT id, role INTO v_caller_member_id, v_caller_role
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_caller_member_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required to submit contributions.';
    END IF;

    -- Regular members can ONLY submit for themselves
    IF v_caller_role IN ('admin', 'officer') AND p_member_id IS NOT NULL THEN
        v_target_member_id := p_member_id;
    ELSE
        v_target_member_id := v_caller_member_id;
    END IF;

    IF v_target_member_id IS NULL THEN
        RAISE EXCEPTION 'Invalid member target.';
    END IF;

    INSERT INTO public.contributions (
        member_id,
        title,
        category,
        amount,
        payment_method,
        reference_number,
        proof_receipt_url,
        status,
        contribution_date
    ) VALUES (
        v_target_member_id,
        p_title,
        COALESCE(p_category, 'Monthly Dues'),
        p_amount,
        COALESCE(p_payment_method, 'GCash'),
        p_reference_number,
        p_proof_receipt_url,
        'pending',
        CURRENT_DATE
    )
    RETURNING id INTO v_contrib_id;

    -- Audit log with authentic actor
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_caller_member_id,
        'SUBMIT_CONTRIBUTION',
        'contributions',
        v_contrib_id,
        jsonb_build_object('amount', p_amount, 'reference_number', p_reference_number, 'target_member', v_target_member_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'contribution_id', v_contrib_id,
        'message', 'Contribution submitted successfully for officer verification.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_member_contribution FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_member_contribution FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_member_contribution TO authenticated;

-- 6.2 record_officer_attendance: Verify officer identity server-side
CREATE OR REPLACE FUNCTION public.record_officer_attendance(
    p_event_id UUID,
    p_member_number TEXT,
    p_officer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_officer_id UUID;
    v_member RECORD;
    v_event RECORD;
    v_existing_attendance UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Authenticate officer
    SELECT id INTO v_auth_officer_id
    FROM public.members
    WHERE user_id = auth.uid() AND role IN ('admin', 'officer') AND membership_status = 'active';

    IF v_auth_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can record attendance.';
    END IF;

    -- Find target member
    SELECT id, first_name, last_name, role, membership_status, chapter_or_branch, avatar_url
    INTO v_member
    FROM public.members
    WHERE UPPER(TRIM(member_number)) = UPPER(TRIM(p_member_number));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Member credential ID ' || p_member_number || ' not found in national registry.'
        );
    END IF;

    -- Verify event
    SELECT id, title, status, checkin_open INTO v_event
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Assembly event not found.'
        );
    END IF;

    IF v_event.status NOT IN ('published', 'ongoing') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Event check-in is not active.'
        );
    END IF;

    -- Check existing attendance
    SELECT id INTO v_existing_attendance
    FROM public.attendance
    WHERE event_id = p_event_id AND member_id = v_member.id;

    IF v_existing_attendance IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_checked_in', true,
            'message', 'Eagle ' || v_member.first_name || ' ' || v_member.last_name || ' is already checked in.'
        );
    END IF;

    -- Insert attendance record with verified officer identity
    INSERT INTO public.attendance (
        event_id,
        member_id,
        status,
        check_in_time,
        check_in_method,
        verified_by
    ) VALUES (
        p_event_id,
        v_member.id,
        'present',
        timezone('utc'::text, now()),
        'officer_manual',
        v_auth_officer_id
    );

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_auth_officer_id,
        'SECRETARIAT_QR_CHECKIN',
        'attendance',
        p_event_id,
        jsonb_build_object('member_id', v_member.id, 'member_number', p_member_number, 'officer_id', v_auth_officer_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Attendance confirmed for ' || v_member.first_name || ' ' || v_member.last_name || '!',
        'member', jsonb_build_object(
            'id', v_member.id,
            'name', v_member.first_name || ' ' || v_member.last_name,
            'role', v_member.role,
            'status', v_member.membership_status,
            'club', v_member.chapter_or_branch,
            'member_number', p_member_number
        )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_officer_attendance FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_officer_attendance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_officer_attendance TO authenticated;

-- 6.3 update_member_official_id: Bind to authenticated caller
CREATE OR REPLACE FUNCTION public.update_member_official_id(
    p_member_id UUID,
    p_id_url TEXT,
    p_front_url TEXT DEFAULT NULL,
    p_back_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role user_role;
    v_target_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    SELECT id, role INTO v_caller_id, v_caller_role
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required.';
    END IF;

    -- Ordinary members can only update their own official ID
    IF v_caller_role IN ('admin', 'officer') AND p_member_id IS NOT NULL THEN
        v_target_id := p_member_id;
    ELSE
        v_target_id := v_caller_id;
    END IF;

    UPDATE public.members
    SET 
        official_id_url = COALESCE(p_id_url, official_id_url),
        id_card_front_url = COALESCE(p_front_url, p_id_url, id_card_front_url),
        id_card_back_url = COALESCE(p_back_url, id_card_back_url),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_target_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Member record not found.');
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_caller_id,
        'UPDATE_OFFICIAL_ID',
        'members',
        v_target_id,
        jsonb_build_object('target_id', v_target_id, 'updated_by', v_caller_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Official Eagles ID updated successfully.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_member_official_id FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_member_official_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_official_id TO authenticated;

-- 6.4 update_member_profile: Bind to authenticated caller
CREATE OR REPLACE FUNCTION public.update_member_profile(
    p_member_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_blood_type TEXT DEFAULT NULL,
    p_emergency_name TEXT DEFAULT NULL,
    p_emergency_phone TEXT DEFAULT NULL,
    p_chapter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role user_role;
    v_target_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    SELECT id, role INTO v_caller_id, v_caller_role
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required.';
    END IF;

    -- Regular members can only update their own profile
    IF v_caller_role IN ('admin', 'officer') AND p_member_id IS NOT NULL THEN
        v_target_id := p_member_id;
    ELSE
        v_target_id := v_caller_id;
    END IF;

    UPDATE public.members
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        phone = COALESCE(p_phone, phone),
        blood_type = COALESCE(p_blood_type, blood_type),
        emergency_contact_name = COALESCE(p_emergency_name, emergency_contact_name),
        emergency_contact_phone = COALESCE(p_emergency_phone, emergency_contact_phone),
        chapter_or_branch = COALESCE(p_chapter, chapter_or_branch),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_target_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Member profile record not found.');
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_caller_id,
        'UPDATE_MEMBER_PROFILE',
        'members',
        v_target_id,
        jsonb_build_object('target_id', v_target_id, 'updated_by', v_caller_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile details updated successfully.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_member_profile FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_member_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_profile TO authenticated;

-- =============================================================================
-- 7. F-05: Secure check_in_event (Remove AGILA-2024-001 Hardcoded Fallback)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_in_event(
    p_event_id UUID,
    p_checkin_code TEXT,
    p_member_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_member_id UUID;
    v_caller_status membership_status;
    v_caller_role user_role;
    v_target_member_id UUID;
    v_event RECORD;
    v_existing_attendance RECORD;
BEGIN
    -- 1. Authentication check
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required to check in.');
    END IF;

    -- 2. Derive caller member from auth.uid() (NO hardcoded fallback)
    SELECT id, membership_status, role INTO v_caller_member_id, v_caller_status, v_caller_role
    FROM public.members
    WHERE user_id = auth.uid();

    IF v_caller_member_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Member account profile not found for authenticated user.');
    END IF;

    IF v_caller_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only active members can check in to assemblies.');
    END IF;

    -- Officers may optionally specify a target member, but regular members can ONLY check in themselves
    IF v_caller_role IN ('admin', 'officer') AND p_member_id IS NOT NULL THEN
        v_target_member_id := p_member_id;
    ELSE
        v_target_member_id := v_caller_member_id;
    END IF;

    -- 3. Validate Event & Check-in Window
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Assembly event not found.');
    END IF;

    IF v_event.status NOT IN ('published', 'ongoing') OR v_event.checkin_open IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in is currently closed for this assembly.');
    END IF;

    -- 4. Validate Check-in code
    IF upper(trim(v_event.checkin_code)) != upper(trim(p_checkin_code)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid check-in code. Please check the code provided by the Secretariat.');
    END IF;

    -- 5. Check if already checked in
    SELECT * INTO v_existing_attendance FROM public.attendance 
    WHERE event_id = p_event_id AND member_id = v_target_member_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_checked_in', true, 'message', 'You have already checked in for this event!');
    END IF;

    -- 6. Insert attendance record
    INSERT INTO public.attendance (
        event_id,
        member_id,
        status,
        check_in_method,
        notes
    ) VALUES (
        p_event_id,
        v_target_member_id,
        'present',
        'self_pin',
        'Verified via AGILA Hub Portal'
    );

    -- 7. Audit Log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_caller_member_id,
        'SELF_PIN_CHECKIN',
        'attendance',
        p_event_id,
        jsonb_build_object('event_id', p_event_id, 'target_member', v_target_member_id)
    );

    RETURN jsonb_build_object('success', true, 'already_checked_in', false, 'message', 'Attendance successfully recorded! Mabuhay ang Agila!');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_in_event FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_in_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_event TO authenticated;

-- =============================================================================
-- 8. F-06: Storage Security - Private member-ids Bucket & Strict RLS
-- =============================================================================
-- Create private bucket for official member IDs
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-ids', 'member-ids', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ensure receipts bucket is also marked private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- Drop old storage policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public view receipts and ids" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated or Anon upload ids" ON storage.objects;
    DROP POLICY IF EXISTS "Public view receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated or Anon upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "member_ids_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "member_ids_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "receipts_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "receipts_insert_policy" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Policies for member-ids bucket
CREATE POLICY "member_ids_select_policy"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'member-ids'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

CREATE POLICY "member_ids_insert_policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'member-ids'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

-- Policies for receipts bucket
CREATE POLICY "receipts_select_policy"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

CREATE POLICY "receipts_insert_policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
    );
