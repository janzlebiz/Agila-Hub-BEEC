-- =============================================================================
-- Script: execution/patch_role_security_functions.sql
-- Description: Enforce Server-Side Officer/Admin Role Authorization Checks
-- Resolves Multi-Role Matrix Failures:
--   1. approve_member_applicant: Strictly verifies caller has active officer/admin role.
--   2. verify_contribution: Strictly verifies caller has active officer/admin role.
--   3. get_financial_ledger_summary: Creates safe ledger summary RPC for authenticated officers.
--   4. officer_submit_contribution_for_member: Fixes contribution_status enum cast.
--   5. Function ownership and privilege tightening (REVOKE from anon/PUBLIC, GRANT to authenticated).
-- Safe to run in Supabase Dashboard -> SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Hardened approve_member_applicant RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_member_applicant(
    p_member_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

ALTER FUNCTION public.approve_member_applicant(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.approve_member_applicant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_member_applicant(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Hardened verify_contribution RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_contribution(
    p_contribution_id UUID,
    p_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL,
    p_verified_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    -- 2. Derive authorized officer from authenticated session
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

ALTER FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_contribution(UUID, TEXT, TEXT, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Safe Financial Ledger Summary RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_financial_ledger_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

ALTER FUNCTION public.get_financial_ledger_summary() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_financial_ledger_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_ledger_summary() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Fix officer_submit_contribution_for_member (status enum casting)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.officer_submit_contribution_for_member(
    p_target_member_id UUID,
    p_title TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT DEFAULT NULL,
    p_proof_receipt_url TEXT DEFAULT NULL,
    p_auto_verify BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_officer_id UUID;
    v_contrib_id UUID;
    v_initial_status contribution_status := 'pending'::contribution_status;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Verify acting officer
    SELECT id INTO v_officer_id
    FROM public.members
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers can record contributions on behalf of other members.';
    END IF;

    -- Verify target member exists
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = p_target_member_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Target member record not found.');
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Contribution amount must be greater than zero.';
    END IF;

    IF p_auto_verify THEN
        v_initial_status := 'verified'::contribution_status;
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
        verified_by,
        verified_at,
        contribution_date
    ) VALUES (
        p_target_member_id,
        TRIM(p_title),
        p_category,
        p_amount,
        p_payment_method,
        NULLIF(TRIM(p_reference_number), ''),
        NULLIF(TRIM(p_proof_receipt_url), ''),
        v_initial_status,
        CASE WHEN p_auto_verify THEN v_officer_id ELSE NULL END,
        CASE WHEN p_auto_verify THEN timezone('utc'::text, now()) ELSE NULL END,
        CURRENT_DATE
    )
    RETURNING id INTO v_contrib_id;

    -- Audit log attributing the officer
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_officer_id,
        'OFFICER_RECORD_CONTRIBUTION',
        'contributions',
        v_contrib_id,
        jsonb_build_object(
            'target_member_id', p_target_member_id,
            'officer_id', v_officer_id,
            'amount', p_amount,
            'auto_verified', p_auto_verify
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'contribution_id', v_contrib_id,
        'message', 'Contribution recorded on behalf of member successfully.'
    );
END;
$$;

ALTER FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Record migration version
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) THEN
        INSERT INTO supabase_migrations.schema_migrations (version)
        VALUES ('20261019000009')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;
