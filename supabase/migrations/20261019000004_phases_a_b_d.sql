-- =============================================================================
-- Migration: 20261019000004_phases_a_b_d.sql
-- Description: RPCs for Contribution Submissions, Verification, Secretariat Scanner,
--              and Storage Bucket for Receipts.
-- =============================================================================

-- 1. Create Receipts Storage Bucket (Private bucket, authenticated access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Receipts Bucket Policies: Authenticated users can view their receipts, officers view all
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public view receipts" ON storage.objects;
    CREATE POLICY "Authenticated view receipts"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'receipts'
            AND (
                (storage.foldername(name))[1] = auth.uid()::text
                OR public.is_officer()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated or Anon upload receipts" ON storage.objects;
    CREATE POLICY "Authenticated upload receipts"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'receipts'
            AND auth.role() = 'authenticated'
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. RPC: submit_member_contribution (Bound to authenticated member, no arbitrary fallback)
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

    -- Log action in audit log with real authenticated actor
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

-- 3. RPC: verify_contribution (Enforce server-side officer authorization, derive verified_by)
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Derive authorized officer from authenticated session
    SELECT id INTO v_officer_id 
    FROM public.members 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can verify financial contributions.';
    END IF;

    -- Validate status transition
    IF p_status NOT IN ('verified', 'rejected') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid status transition. Status must be verified or rejected.');
    END IF;

    SELECT status, amount INTO v_existing_status, v_amount
    FROM public.contributions
    WHERE id = p_contribution_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contribution record not found.');
    END IF;

    IF v_existing_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contribution is already processed (' || v_existing_status || ').');
    END IF;

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

    -- Audit log with authentic actor
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

-- 4. RPC: record_officer_attendance (Secretariat Camera QR Scanner - Authorized Officer Only)
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

    -- 1. Find member by member_number (case-insensitive)
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

    -- 2. Verify event exists
    SELECT id, title, status INTO v_event
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Specified assembly event not found.'
        );
    END IF;

    IF v_event.status NOT IN ('published', 'ongoing') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Check-in is closed for this event.'
        );
    END IF;

    -- 3. Check for existing attendance
    SELECT id INTO v_existing_attendance
    FROM public.attendance
    WHERE event_id = p_event_id AND member_id = v_member.id;

    IF v_existing_attendance IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_checked_in', true,
            'message', 'Eagle ' || v_member.first_name || ' ' || v_member.last_name || ' is already checked in.',
            'member', jsonb_build_object(
                'name', v_member.first_name || ' ' || v_member.last_name,
                'role', v_member.role,
                'status', v_member.membership_status,
                'club', v_member.chapter_or_branch
            )
        );
    END IF;

    -- 4. Insert attendance record with authenticated officer
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

    -- 5. Audit log
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

-- 5. Grant execute permissions strictly to authenticated users (Revoke anon)
GRANT EXECUTE ON FUNCTION public.submit_member_contribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_contribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_officer_attendance TO authenticated;
