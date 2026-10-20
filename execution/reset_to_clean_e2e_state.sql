-- =============================================================================
-- SQL Script: execution/reset_to_clean_e2e_state.sql
-- Description: Clean up all test fixtures & accounts, and provision Admin account
-- Target Supabase Project: jgpigkeekfuawbyilycq
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_pwd_hash TEXT;
BEGIN
    -- 1. Compute standard bcrypt password hash for AgilaAdmin2026!
    v_pwd_hash := extensions.crypt('AgilaAdmin2026!', extensions.gen_salt('bf', 10));

    -- 2. Clear circular references and unlink users on charter members
    UPDATE public.members 
    SET approved_by = NULL;

    UPDATE public.members 
    SET user_id = NULL 
    WHERE member_number IN ('AGILA-2024-001', 'AGILA-2024-002', 'AGILA-2024-003', 'AGILA-2025-101', 'AGILA-TEMP-999');

    -- Restore Juan Dela Cruz's original charter name
    UPDATE public.members 
    SET first_name = 'Juan', last_name = 'Dela Cruz' 
    WHERE member_number = 'AGILA-2024-001';

    -- 3. Delete all test claim tokens
    DELETE FROM public.member_claim_tokens;

    -- 4. Delete test fixtures from public.members
    DELETE FROM public.members WHERE 
        member_number IN (
            'FIXTURE-APPLICANT-PROBE',
            'FIXTURE-SECURITY-PROBE',
            'FIXTURE-SUSPENDED-PROBE',
            'TEST-ADMIN-01',
            'TEST-MEMBER-A',
            'TEST-MEMBER-B',
            'TEST-OFFICER-01',
            'TEST-SUSPENDED-01',
            'AGILA-ADMIN-001'
        ) 
        OR email IN (
            'member.a@eagles.internal',
            'member.b@eagles.internal',
            'officer@eagles.internal',
            'admin@eagles.internal',
            'suspended@eagles.internal',
            'test.agila.member.a@gmail.com',
            'applicant.probe@eagles.internal',
            'security.probe@eagles.internal',
            'suspended.probe@eagles.internal',
            'admin@agilahub.ph'
        );

    -- 5. Remove all test users from auth.users (cascades to auth.identities)
    DELETE FROM auth.users WHERE email IN (
        'member.a@eagles.internal',
        'member.b@eagles.internal',
        'officer@eagles.internal',
        'admin@eagles.internal',
        'suspended@eagles.internal',
        'test.agila.member.a@gmail.com',
        'kuya.juan@eagles.org.ph',
        'admin@agilahub.ph'
    );

    -- 6. Insert clean Admin account into auth.users (triggers handle_new_user())
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
        'admin@agilahub.ph', v_pwd_hash, timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"first_name":"National","last_name":"Administrator"}'::jsonb,
        timezone('utc'::text, now()), timezone('utc'::text, now()),
        '', '', '', ''
    );

    -- 7. Insert identity into auth.identities
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_admin_id, v_admin_id, v_admin_id::text,
        jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@agilahub.ph'),
        'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
    );

    -- 8. Elevate the member row created by trigger to Admin with active status
    UPDATE public.members SET
        member_number = 'AGILA-ADMIN-001',
        first_name = 'National',
        last_name = 'Administrator',
        role = 'admin',
        membership_status = 'active',
        chapter_or_branch = 'Bantayog Elite Eagles Club',
        blood_type = 'O+'
    WHERE user_id = v_admin_id;

END $$;
