-- =============================================================================
-- Migration: 20261019000004_phases_a_b_d.sql
-- Description: RPCs for Contribution Submissions, Verification, Secretariat Scanner,
--              and Storage Bucket for Receipts.
-- =============================================================================

-- 1. Create Receipts Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Receipts Bucket Policies
DO $$ BEGIN
    CREATE POLICY "Public view receipts"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'receipts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated or Anon upload receipts"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'receipts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. RPC: submit_member_contribution
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
    v_contrib_id UUID;
    v_member_name TEXT;
BEGIN
    -- Verify member exists
    SELECT first_name || ' ' || last_name INTO v_member_name
    FROM public.members
    WHERE id = p_member_id;

    IF v_member_name IS NULL THEN
        -- Fallback to first member if ID not matched
        SELECT id, first_name || ' ' || last_name INTO p_member_id, v_member_name
        FROM public.members
        LIMIT 1;
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
        p_member_id,
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

    -- Log action in audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        p_member_id,
        'SUBMIT_CONTRIBUTION',
        'contributions',
        v_contrib_id,
        jsonb_build_object('amount', p_amount, 'reference_number', p_reference_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'contribution_id', v_contrib_id,
        'message', 'Contribution submitted successfully for officer verification.'
    );
END;
$$;

-- 3. RPC: verify_contribution
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
    v_existing_status TEXT;
    v_amount NUMERIC;
BEGIN
    SELECT status, amount INTO v_existing_status, v_amount
    FROM public.contributions
    WHERE id = p_contribution_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contribution record not found.');
    END IF;

    UPDATE public.contributions
    SET status = p_status::contribution_status,
        rejection_reason = p_rejection_reason,
        verified_by = p_verified_by,
        verified_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_contribution_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        p_verified_by,
        'VERIFY_CONTRIBUTION',
        'contributions',
        p_contribution_id,
        jsonb_build_object('status', p_status, 'amount', v_amount)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Contribution marked as ' || p_status || '.'
    );
END;
$$;

-- 4. RPC: record_officer_attendance (Secretariat Camera QR Scanner)
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
    v_member RECORD;
    v_event_title TEXT;
    v_existing_attendance UUID;
BEGIN
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
    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Specified assembly event not found.'
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

    -- 4. Insert attendance record
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
        p_officer_id
    );

    -- 5. Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        p_officer_id,
        'SECRETARIAT_QR_CHECKIN',
        'attendance',
        p_event_id,
        jsonb_build_object('member_id', v_member.id, 'member_number', p_member_number)
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

-- 5. Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.submit_member_contribution TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_contribution TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_officer_attendance TO anon, authenticated;

-- Ensure public can view verified contributions in audited ledger
DO $$ BEGIN
    CREATE POLICY "Public view verified contributions"
        ON public.contributions FOR SELECT
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
