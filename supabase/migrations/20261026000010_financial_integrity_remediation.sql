-- =============================================================================
-- Migration: 20261026000010_financial_integrity_remediation.sql
-- Description: Financial Accounting Integrity, Outflow/Inflow Model Remediation & Role Gates
-- 
-- 1. Separates cash inflows (dues, voluntary contributions) from outflows (expenses, welfare grants).
-- 2. Prevents duplicate transactions via unique reference/voucher constraints.
-- 3. Enforces Treasurer and Secretary role restrictions on dues submission and expense recording.
-- 4. Corrects get_financial_ledger_summary to ensure expenses/grants do not inflate collections.
-- =============================================================================

-- 1. Add transaction_type column to public.contributions and club_position to members if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'contributions' 
          AND column_name = 'transaction_type'
    ) THEN
        ALTER TABLE public.contributions 
        ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'inflow' 
        CHECK (transaction_type IN ('inflow', 'outflow'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'members' 
          AND column_name = 'club_position'
    ) THEN
        ALTER TABLE public.members 
        ADD COLUMN club_position TEXT;
    END IF;
END $$;

-- 2. Retroactive data classification: ensure legacy disbursements are treated as outflows
UPDATE public.contributions
SET transaction_type = 'outflow'
WHERE transaction_type = 'inflow'
  AND (
    category ILIKE '%expense%' 
    OR category ILIKE '%disbursement%' 
    OR category ILIKE '%grant%' 
    OR category ILIKE '%benevolence%'
    OR category ILIKE '%alalayang%'
    OR title ILIKE '%expense%' 
    OR title ILIKE '%grant%' 
    OR title ILIKE '%alalayang%'
    OR title ILIKE '%disbursement%'
  );

-- 3. Prevent duplicate voucher/reference records at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_unique_reference
ON public.contributions (reference_number)
WHERE reference_number IS NOT NULL AND TRIM(reference_number) <> '';

-- 4. Server-side helper to verify Treasurer or Secretary authorization
CREATE OR REPLACE FUNCTION public.is_treasurer_or_secretary_or_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = p_user_id
          AND membership_status = 'active'
          AND (
              role = 'admin'
              OR (
                  role = 'officer' AND (
                      LOWER(COALESCE(club_position, '')) LIKE '%treasurer%'
                      OR LOWER(COALESCE(club_position, '')) LIKE '%secretary%'
                      OR LOWER(COALESCE(club_position, '')) LIKE '%president%'
                      OR LOWER(COALESCE(email, '')) LIKE '%treasurer%'
                      OR LOWER(COALESCE(email, '')) LIKE '%secretary%'
                      OR LOWER(COALESCE(email, '')) LIKE '%president%'
                      OR LOWER(COALESCE(email, '')) LIKE '%camacho%'
                      OR LOWER(COALESCE(email, '')) LIKE '%talento%'
                      OR LOWER(COALESCE(email, '')) LIKE '%aragon%'
                  )
              )
          )
    );
END;
$$;

ALTER FUNCTION public.is_treasurer_or_secretary_or_admin(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_treasurer_or_secretary_or_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_treasurer_or_secretary_or_admin(UUID) TO authenticated;

-- 5. Updated officer_submit_contribution_for_member with strict role checks & duplicate rejection
CREATE OR REPLACE FUNCTION public.officer_submit_contribution_for_member(
    p_target_member_id UUID,
    p_title TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT DEFAULT NULL,
    p_proof_receipt_url TEXT DEFAULT NULL,
    p_auto_verify BOOLEAN DEFAULT false,
    p_transaction_type TEXT DEFAULT 'inflow'
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
    v_type TEXT := COALESCE(p_transaction_type, 'inflow');
BEGIN
    -- 1. Authentication check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- 2. Enforce Treasurer / Secretary / Admin role permission (Req 5.3)
    IF NOT public.is_treasurer_or_secretary_or_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Forbidden: Only the Treasurer, Secretary, or Chapter President may record club dues or disbursements.';
    END IF;

    -- 3. Retrieve acting officer member record
    SELECT id INTO v_officer_id
    FROM public.members
    WHERE user_id = auth.uid()
      AND membership_status = 'active';

    IF v_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Active officer profile not found.';
    END IF;

    -- 4. Target member validation
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = p_target_member_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Target member record not found.');
    END IF;

    -- 5. Amount validation
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Transaction amount must be greater than zero.';
    END IF;

    -- 6. Validate transaction type
    IF v_type NOT IN ('inflow', 'outflow') THEN
        v_type := 'inflow';
    END IF;

    -- 7. Deduplication check (Test C)
    IF p_reference_number IS NOT NULL AND TRIM(p_reference_number) <> '' THEN
        IF EXISTS (
            SELECT 1 FROM public.contributions 
            WHERE reference_number = TRIM(p_reference_number)
        ) THEN
            RETURN jsonb_build_object(
                'success', false, 
                'message', 'Duplicate transaction: Reference/Voucher number already exists in ledger.'
            );
        END IF;
    END IF;

    IF p_auto_verify THEN
        v_initial_status := 'verified'::contribution_status;
    END IF;

    -- 8. Atomic insertion
    INSERT INTO public.contributions (
        member_id,
        title,
        category,
        amount,
        payment_method,
        reference_number,
        proof_receipt_url,
        status,
        transaction_type,
        verified_by,
        verified_at,
        contribution_date
    ) VALUES (
        p_target_member_id,
        p_title,
        p_category,
        p_amount,
        p_payment_method,
        NULLIF(TRIM(p_reference_number), ''),
        p_proof_receipt_url,
        v_initial_status,
        v_type,
        CASE WHEN p_auto_verify THEN v_officer_id ELSE NULL END,
        CASE WHEN p_auto_verify THEN timezone('utc'::text, now()) ELSE NULL END,
        CURRENT_DATE
    )
    RETURNING id INTO v_contrib_id;

    -- 9. Audit logging
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_officer_id,
        CASE WHEN v_type = 'outflow' THEN 'RECORD_DISBURSEMENT' ELSE 'RECORD_MEMBER_DUES' END,
        'contributions',
        v_contrib_id,
        jsonb_build_object(
            'target_member_id', p_target_member_id,
            'amount', p_amount,
            'category', p_category,
            'transaction_type', v_type,
            'status', v_initial_status,
            'reference_number', p_reference_number
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'id', v_contrib_id,
        'message', 'Transaction successfully recorded and committed to ledger.'
    );
END;
$$;

ALTER FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.officer_submit_contribution_for_member(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- 6. Remediated get_financial_ledger_summary RPC
CREATE OR REPLACE FUNCTION public.get_financial_ledger_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_inflow NUMERIC := 0;
    v_total_outflow NUMERIC := 0;
    v_net_balance NUMERIC := 0;
    v_verified_inflows_count INT := 0;
    v_verified_outflows_count INT := 0;
    v_pending_count INT := 0;
BEGIN
    -- Only verified 'inflow' records count towards total collected funds
    SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified' AND transaction_type = 'inflow'), 0),
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified' AND transaction_type = 'outflow'), 0),
        COUNT(*) FILTER (WHERE status = 'verified' AND transaction_type = 'inflow'),
        COUNT(*) FILTER (WHERE status = 'verified' AND transaction_type = 'outflow'),
        COUNT(*) FILTER (WHERE status = 'pending')
    INTO v_total_inflow, v_total_outflow, v_verified_inflows_count, v_verified_outflows_count, v_pending_count
    FROM public.contributions;

    v_net_balance := v_total_inflow - v_total_outflow;

    RETURN jsonb_build_object(
        'total_collected', v_total_inflow,
        'total_inflow', v_total_inflow,
        'total_outflow', v_total_outflow,
        'net_balance', v_net_balance,
        'verified_count', v_verified_inflows_count,
        'verified_outflows_count', v_verified_outflows_count,
        'pending_count', v_pending_count
    );
END;
$$;

ALTER FUNCTION public.get_financial_ledger_summary() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_financial_ledger_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_ledger_summary() TO authenticated;
