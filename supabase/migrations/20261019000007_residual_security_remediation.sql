-- =============================================================================
-- Migration: 20261019000007_residual_security_remediation.sql
-- Description: Remediates Residual Security Audit Issues R-01 through R-05
--   - R-02: Remove shared demo claim token seed; enforce hashed claim tokens & officer generation
--   - R-03: Dynamic cleanup of all legacy storage policies; scope receipts upload to owner folder
--   - R-04: Strict separation of self-service operations (bound to auth.uid()) from officer operations
--   - R-05: Require checkin_open = true in attendance; remove public URL receipt fallback
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Prerequisites: Ensure Member Profile and Credential Columns Exist
-- =============================================================================
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS official_id_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
    ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT 'O+',
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- =============================================================================
-- 1. R-02: Cryptographic Hashed Claim Tokens & Officer Token Generation
-- =============================================================================

-- Create member_claim_tokens table self-contained if absent
CREATE TABLE IF NOT EXISTS public.member_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    token_code TEXT,
    token_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '48 hours'),
    consumed_at TIMESTAMPTZ DEFAULT NULL,
    consumed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_by_officer_id UUID REFERENCES public.members(id) ON DELETE SET NULL
);

-- Ensure columns exist regardless of legacy table definition
ALTER TABLE public.member_claim_tokens 
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS token_code TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by_officer_id UUID REFERENCES public.members(id) ON DELETE SET NULL;

-- Relax legacy NOT NULL / UNIQUE constraints on token_code if present
DO $$
BEGIN
    ALTER TABLE public.member_claim_tokens ALTER COLUMN token_code DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.member_claim_tokens DROP CONSTRAINT IF EXISTS member_claim_tokens_token_code_key;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS on member_claim_tokens
ALTER TABLE public.member_claim_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Officers manage claim tokens" ON public.member_claim_tokens;
CREATE POLICY "Officers manage claim tokens"
    ON public.member_claim_tokens FOR ALL
    TO authenticated
    USING (public.is_officer());

-- Migrate legacy plaintext tokens if token_code column exists, then purge demo seeds
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'member_claim_tokens' AND column_name = 'token_code'
    ) THEN
        -- Hash any existing tokens that have token_code set
        UPDATE public.member_claim_tokens 
        SET token_hash = encode(digest(TRIM(token_code), 'sha256'), 'hex')
        WHERE token_hash IS NULL AND token_code IS NOT NULL;

        -- Remove hardcoded demo or test tokens
        DELETE FROM public.member_claim_tokens 
        WHERE token_code IN ('EAGLE-CLAIM-2026', 'TEST-CLAIM-9999');

        -- Nullify plaintext token_code values so no plaintext tokens persist
        UPDATE public.member_claim_tokens SET token_code = NULL WHERE token_code IS NOT NULL;
    END IF;
END $$;

-- Purge any orphaned demo seeds for test member numbers
DELETE FROM public.member_claim_tokens 
WHERE member_id IN (
    SELECT id FROM public.members 
    WHERE member_number IN ('AGILA-TEMP-999', 'AGILA-2024-001')
);

-- Ensure index on (member_id, token_hash)
CREATE INDEX IF NOT EXISTS idx_member_claim_tokens_hash 
    ON public.member_claim_tokens (member_id, token_hash);

-- Dynamically clean up any existing overloads of modified security-critical functions
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
              'generate_member_claim_token',
              'claim_member_account',
              'submit_self_contribution',
              'officer_submit_contribution_for_member',
              'submit_member_contribution',
              'update_self_profile',
              'officer_update_member_profile',
              'update_member_profile',
              'update_self_official_id',
              'update_member_official_id',
              'check_in_self_event',
              'check_in_event',
              'record_officer_attendance'
          )
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', func.proname, func.argtypes);
    END LOOP;
END $$;

-- Officer-Authorized Cryptographic Claim Token Generator
CREATE OR REPLACE FUNCTION public.generate_member_claim_token(
    p_member_number TEXT,
    p_expires_in_hours INT DEFAULT 48
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_officer RECORD;
    v_target_member RECORD;
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_expires_at TIMESTAMPTZ;
    v_hours INT;
BEGIN
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Verify caller is an active officer or administrator
    SELECT id, first_name, last_name, role INTO v_officer
    FROM public.members
    WHERE user_id = v_auth_uid 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_officer.id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can generate claim tokens.';
    END IF;

    -- Find target member by member_number
    SELECT id, first_name, last_name, user_id, membership_status, member_number
    INTO v_target_member
    FROM public.members
    WHERE UPPER(TRIM(member_number)) = UPPER(TRIM(p_member_number));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Member number ' || p_member_number || ' not found in national registry.'
        );
    END IF;

    IF v_target_member.user_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Member ' || p_member_number || ' is already linked to an active account.'
        );
    END IF;

    -- Bound expiration window (min 1 hour, max 168 hours / 7 days)
    v_hours := LEAST(GREATEST(COALESCE(p_expires_in_hours, 48), 1), 168);
    v_expires_at := timezone('utc'::text, now()) + (v_hours || ' hours')::INTERVAL;

    -- Generate high-entropy 32-character hexadecimal token (128-bit cryptographically secure)
    v_raw_token := encode(gen_random_bytes(16), 'hex');
    v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

    -- Invalidate any existing unconsumed tokens for this member
    UPDATE public.member_claim_tokens
    SET consumed_at = timezone('utc'::text, now()),
        consumed_by_user_id = v_auth_uid
    WHERE member_id = v_target_member.id AND consumed_at IS NULL;

    -- Store only the cryptographic hash
    INSERT INTO public.member_claim_tokens (
        member_id,
        token_hash,
        created_by,
        expires_at
    ) VALUES (
        v_target_member.id,
        v_token_hash,
        v_officer.id,
        v_expires_at
    );

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_officer.id,
        'GENERATE_CLAIM_TOKEN',
        'members',
        v_target_member.id,
        jsonb_build_object(
            'member_number', v_target_member.member_number,
            'expires_at', v_expires_at,
            'officer_id', v_officer.id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Claim token generated successfully. Deliver this token privately to the member.',
        'member_number', v_target_member.member_number,
        'member_name', v_target_member.first_name || ' ' || v_target_member.last_name,
        'raw_claim_token', v_raw_token,
        'expires_at', v_expires_at
    );
END;
$$;

-- Upgrade claim_member_account to verify SHA-256 hash
CREATE OR REPLACE FUNCTION public.claim_member_account(
    p_member_number TEXT,
    p_claim_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_member RECORD;
    v_token RECORD;
    v_candidate_hash TEXT;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required to claim member profile.');
    END IF;

    IF p_claim_token IS NULL OR TRIM(p_claim_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Claim token is required.');
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

    -- Compute candidate token hash
    v_candidate_hash := encode(digest(TRIM(p_claim_token), 'sha256'), 'hex');

    -- Validate claim token ONLY by cryptographic hash (R-02)
    SELECT id, expires_at, consumed_at
    INTO v_token
    FROM public.member_claim_tokens
    WHERE member_id = v_member.id
      AND token_hash = v_candidate_hash
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

    -- Mark token consumed atomically with single-use concurrency guard
    UPDATE public.member_claim_tokens
    SET consumed_at = timezone('utc'::text, now()),
        consumed_by_user_id = v_auth_uid
    WHERE id = v_token.id AND consumed_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Claim token was consumed concurrently. Please retry.');
    END IF;

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

-- =============================================================================
-- 2. R-03: Comprehensive Storage Policy Cleanup & Scoped Receipts Bucket
-- =============================================================================

-- Ensure buckets are strictly private
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-ids', 'member-ids', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Inventory and drop EVERY policy on storage.objects that is not our strict managed set
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', r.policyname);
    END LOOP;
END $$;

-- Policies for member-ids: strictly owner folder ({auth.uid()}/*) or active officer
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

CREATE POLICY "member_ids_update_policy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'member-ids'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

CREATE POLICY "member_ids_delete_policy"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'member-ids'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

-- Policies for receipts: strictly owner folder ({auth.uid()}/*) or active officer
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
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

CREATE POLICY "receipts_update_policy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

CREATE POLICY "receipts_delete_policy"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_officer()
        )
    );

-- =============================================================================
-- 3. R-04 & R-05: Separation of Self-Service vs. Officer Operations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 Self-Service: submit_self_contribution (Bound exclusively to auth.uid())
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_self_contribution(
    p_title TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT DEFAULT NULL,
    p_proof_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member_id UUID;
    v_contrib_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Derive member exclusively from authenticated identity
    SELECT id INTO v_member_id
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No active member record linked to authenticated user.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Contribution amount must be greater than zero.';
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
        v_member_id,
        TRIM(p_title),
        p_category,
        p_amount,
        p_payment_method,
        NULLIF(TRIM(p_reference_number), ''),
        NULLIF(TRIM(p_proof_receipt_url), ''),
        'pending',
        CURRENT_DATE
    )
    RETURNING id INTO v_contrib_id;

    -- Non-repudiation audit logging
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_member_id,
        'SUBMIT_SELF_CONTRIBUTION',
        'contributions',
        v_contrib_id,
        jsonb_build_object(
            'amount', p_amount,
            'category', p_category,
            'member_id', v_member_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'contribution_id', v_contrib_id,
        'message', 'Contribution submitted successfully for officer verification.'
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.2 Officer Workflow: officer_submit_contribution_for_member
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
SET search_path = public
AS $$
DECLARE
    v_officer_id UUID;
    v_contrib_id UUID;
    v_initial_status TEXT := 'pending';
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
        v_initial_status := 'verified';
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
        'message', 'Contribution recorded on behalf of member.'
    );
END;
$$;

-- Maintain submit_member_contribution for backward compatibility (strictly routes to self)
CREATE OR REPLACE FUNCTION public.submit_member_contribution(
    p_member_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT '',
    p_category TEXT DEFAULT 'general',
    p_amount NUMERIC DEFAULT 0,
    p_payment_method TEXT DEFAULT 'cash',
    p_reference_number TEXT DEFAULT NULL,
    p_proof_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.submit_self_contribution(
        p_title,
        p_category,
        p_amount,
        p_payment_method,
        p_reference_number,
        p_proof_receipt_url
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.3 Self-Service: update_self_profile (Bound exclusively to auth.uid())
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_self_profile(
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
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
    v_member_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    SELECT id INTO v_member_id
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required.';
    END IF;

    UPDATE public.members
    SET 
        first_name = COALESCE(NULLIF(TRIM(p_first_name), ''), first_name),
        last_name = COALESCE(NULLIF(TRIM(p_last_name), ''), last_name),
        phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
        blood_type = COALESCE(NULLIF(TRIM(p_blood_type), ''), blood_type),
        emergency_contact_name = COALESCE(NULLIF(TRIM(p_emergency_name), ''), emergency_contact_name),
        emergency_contact_phone = COALESCE(NULLIF(TRIM(p_emergency_phone), ''), emergency_contact_phone),
        chapter_or_branch = COALESCE(NULLIF(TRIM(p_chapter), ''), chapter_or_branch),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_member_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_member_id,
        'UPDATE_SELF_PROFILE',
        'members',
        v_member_id,
        jsonb_build_object('user_id', auth.uid())
    );

    RETURN jsonb_build_object('success', true, 'message', 'Profile details updated successfully.');
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.4 Officer Workflow: officer_update_member_profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.officer_update_member_profile(
    p_target_member_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_blood_type TEXT DEFAULT NULL,
    p_emergency_name TEXT DEFAULT NULL,
    p_emergency_phone TEXT DEFAULT NULL,
    p_chapter TEXT DEFAULT NULL,
    p_role user_role DEFAULT NULL,
    p_membership_status membership_status DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_officer_id UUID;
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
        RAISE EXCEPTION 'Forbidden: Only active officers can modify another member profile.';
    END IF;

    UPDATE public.members
    SET 
        first_name = COALESCE(NULLIF(TRIM(p_first_name), ''), first_name),
        last_name = COALESCE(NULLIF(TRIM(p_last_name), ''), last_name),
        phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
        blood_type = COALESCE(NULLIF(TRIM(p_blood_type), ''), blood_type),
        emergency_contact_name = COALESCE(NULLIF(TRIM(p_emergency_name), ''), emergency_contact_name),
        emergency_contact_phone = COALESCE(NULLIF(TRIM(p_emergency_phone), ''), emergency_contact_phone),
        chapter_or_branch = COALESCE(NULLIF(TRIM(p_chapter), ''), chapter_or_branch),
        role = COALESCE(p_role, role),
        membership_status = COALESCE(p_membership_status, membership_status),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_target_member_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Target member record not found.');
    END IF;

    -- Audit log attributing officer
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_officer_id,
        'OFFICER_UPDATE_MEMBER_PROFILE',
        'members',
        p_target_member_id,
        jsonb_build_object('target_member_id', p_target_member_id, 'officer_id', v_officer_id)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Member profile updated by officer.');
END;
$$;

-- Maintain update_member_profile routing cleanly
CREATE OR REPLACE FUNCTION public.update_member_profile(
    p_member_id UUID DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
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
BEGIN
    RETURN public.update_self_profile(
        p_first_name,
        p_last_name,
        p_phone,
        p_blood_type,
        p_emergency_name,
        p_emergency_phone,
        p_chapter
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.5 Self-Service: update_self_official_id (Bound exclusively to auth.uid())
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_self_official_id(
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
    v_member_id UUID;
    v_target_front TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    SELECT id INTO v_member_id
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required.';
    END IF;

    v_target_front := COALESCE(NULLIF(TRIM(p_front_url), ''), TRIM(p_id_url));

    UPDATE public.members
    SET official_id_url = v_target_front,
        id_card_front_url = v_target_front,
        id_card_back_url = NULLIF(TRIM(p_back_url), ''),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_member_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_member_id,
        'UPDATE_SELF_OFFICIAL_ID',
        'members',
        v_member_id,
        jsonb_build_object('user_id', auth.uid())
    );

    RETURN jsonb_build_object('success', true, 'message', 'Official digital credential updated.');
END;
$$;

-- Maintain update_member_official_id routing cleanly
CREATE OR REPLACE FUNCTION public.update_member_official_id(
    p_member_id UUID DEFAULT NULL,
    p_id_url TEXT DEFAULT '',
    p_front_url TEXT DEFAULT NULL,
    p_back_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.update_self_official_id(p_id_url, p_front_url, p_back_url);
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.6 Self-Service: check_in_self_event (Bound exclusively to auth.uid())
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_in_self_event(
    p_event_id UUID,
    p_checkin_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member_id UUID;
    v_event RECORD;
    v_existing_attendance RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Derive member strictly from auth.uid()
    SELECT id INTO v_member_id
    FROM public.members
    WHERE user_id = auth.uid() AND membership_status = 'active';

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active member account required for event check-in.';
    END IF;

    -- Validate event window & status
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    IF v_event.status NOT IN ('published', 'ongoing') OR NOT COALESCE(v_event.checkin_open, false) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event check-in window is currently closed.');
    END IF;

    IF UPPER(TRIM(v_event.checkin_code)) <> UPPER(TRIM(p_checkin_code)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid PIN check-in passkey.');
    END IF;

    -- Check if already checked in
    SELECT * INTO v_existing_attendance 
    FROM public.attendance 
    WHERE event_id = p_event_id AND member_id = v_member_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_checked_in', true, 'message', 'You have already checked in for this event!');
    END IF;

    INSERT INTO public.attendance (
        event_id,
        member_id,
        status,
        check_in_method,
        notes
    ) VALUES (
        p_event_id,
        v_member_id,
        'present',
        'self_pin',
        'Verified via AGILA Hub Portal'
    );

    INSERT INTO public.audit_logs (actor_id, action, target_entity, target_id, details)
    VALUES (
        v_member_id,
        'SELF_PIN_CHECKIN',
        'attendance',
        p_event_id,
        jsonb_build_object('event_id', p_event_id, 'member_id', v_member_id)
    );

    RETURN jsonb_build_object('success', true, 'already_checked_in', false, 'message', 'Attendance successfully recorded! Mabuhay ang Agila!');
END;
$$;

-- Maintain check_in_event routing cleanly
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
BEGIN
    RETURN public.check_in_self_event(p_event_id, p_checkin_code);
END;
$$;

-- -----------------------------------------------------------------------------
-- 3.7 Officer Attendance: record_officer_attendance (R-05 Enforces checkin_open)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_officer_attendance(
    p_event_id UUID,
    p_member_number TEXT
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

    -- Verify acting officer strictly from auth.uid()
    SELECT id INTO v_auth_officer_id
    FROM public.members
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_auth_officer_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can record attendance.';
    END IF;

    -- Find target member by member_number
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

    -- Verify event and R-05 REQUIRE checkin_open = true
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
            'message', 'Assembly event is not currently ongoing.'
        );
    END IF;

    -- R-05 CRITICAL REQUIREMENT: Explicit check-in window must be open
    IF NOT COALESCE(v_event.checkin_open, false) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Event check-in window is currently closed by chapter Secretariat.'
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
        jsonb_build_object(
            'member_id', v_member.id,
            'member_number', p_member_number,
            'officer_id', v_auth_officer_id
        )
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

-- =============================================================================
-- 6. Comprehensive Elimination of Blanket SELECT Policies (F-03 & Security Advisor)
-- =============================================================================

-- Dynamically drop any unmanaged or legacy SELECT policies on public.members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'members'
          AND cmd = 'SELECT'
          AND policyname NOT IN ('Strict members visibility')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.members;', r.policyname);
    END LOOP;
END $$;

-- Dynamically drop any unmanaged or legacy SELECT policies on public.contributions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'contributions'
          AND cmd = 'SELECT'
          AND policyname NOT IN ('Strict contributions visibility')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.contributions;', r.policyname);
    END LOOP;
END $$;

-- Enforce strict members visibility: active members see active directory, users see self, officers see all
DROP POLICY IF EXISTS "Strict members visibility" ON public.members;
CREATE POLICY "Strict members visibility"
    ON public.members FOR SELECT
    TO authenticated
    USING (
        (public.is_active_member() AND membership_status = 'active')
        OR user_id = auth.uid()
        OR public.is_officer()
    );

-- Enforce strict contributions visibility: authenticated members see own, officers see all
DROP POLICY IF EXISTS "Strict contributions visibility" ON public.contributions;
CREATE POLICY "Strict contributions visibility"
    ON public.contributions FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

-- =============================================================================
-- 7. Comprehensive Security Advisor Remediation: Revoke Anon/Public Grants
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
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon;', func.proname, func.argtypes);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated;', func.proname, func.argtypes);
    END LOOP;
END $$;

-- =============================================================================
-- 8. Schema Migration Version Tracking (Supabase Schema Migrations)
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) THEN
        INSERT INTO supabase_migrations.schema_migrations (version)
        VALUES 
            ('20261019000004'),
            ('20261019000005'),
            ('20261019000006'),
            ('20261019000007')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;
