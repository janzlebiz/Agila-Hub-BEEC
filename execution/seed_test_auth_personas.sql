-- =============================================================================
-- SQL Script: execution/seed_test_auth_personas.sql
-- Description: Provision 5 Confirmed Test Personas in Supabase Auth & Members
-- Safe to run in Supabase Dashboard -> SQL Editor
-- Common Password for all 5 test accounts: AgilaTestPassword2026!
-- Populates both auth.users (with empty string tokens) and auth.identities
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_pwd_hash TEXT;
    v_user_a_id UUID := '00000000-0000-0000-0001-000000000001';
    v_user_b_id UUID := '00000000-0000-0000-0001-000000000002';
    v_officer_id UUID := '00000000-0000-0000-0001-000000000003';
    v_admin_id UUID := '00000000-0000-0000-0001-000000000004';
    v_suspended_id UUID := '00000000-0000-0000-0001-000000000005';
BEGIN
    -- Compute standard bcrypt password hash using pgcrypto
    v_pwd_hash := extensions.crypt('AgilaTestPassword2026!', extensions.gen_salt('bf', 10));

    -- -------------------------------------------------------------------------
    -- 1. Member A (Active Ordinary Member)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member.a@eagles.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_a_id, 'authenticated', 'authenticated',
            'member.a@eagles.internal', v_pwd_hash, timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Juan","last_name":"Alpha"}'::jsonb,
            timezone('utc'::text, now()), timezone('utc'::text, now()),
            '', '', '', ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_pwd_hash,
            email_confirmed_at = timezone('utc'::text, now()),
            confirmation_token = '',
            email_change = '',
            email_change_token_new = '',
            recovery_token = ''
        WHERE email = 'member.a@eagles.internal';
        SELECT id INTO v_user_a_id FROM auth.users WHERE email = 'member.a@eagles.internal';
    END IF;

    -- Hook up auth.identities (Required by GoTrue)
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_a_id) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_user_a_id, v_user_a_id, v_user_a_id::text,
            jsonb_build_object('sub', v_user_a_id::text, 'email', 'member.a@eagles.internal'),
            'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
        );
    END IF;

    -- Upsert in public.members
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = v_user_a_id) THEN
        INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch)
        VALUES (v_user_a_id, 'member.a@eagles.internal', 'Juan', 'Alpha', 'TEST-MEMBER-A', 'member', 'active', 'Bantayog Elite')
        ON CONFLICT (email) DO UPDATE 
        SET user_id = v_user_a_id, role = 'member', membership_status = 'active', member_number = 'TEST-MEMBER-A';
    ELSE
        UPDATE public.members 
        SET role = 'member', membership_status = 'active', member_number = 'TEST-MEMBER-A' 
        WHERE user_id = v_user_a_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Member B (Cross-Chapter Member for Isolation Probing)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member.b@eagles.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_b_id, 'authenticated', 'authenticated',
            'member.b@eagles.internal', v_pwd_hash, timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Pedro","last_name":"Beta"}'::jsonb,
            timezone('utc'::text, now()), timezone('utc'::text, now()),
            '', '', '', ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_pwd_hash,
            email_confirmed_at = timezone('utc'::text, now()),
            confirmation_token = '',
            email_change = '',
            email_change_token_new = '',
            recovery_token = ''
        WHERE email = 'member.b@eagles.internal';
        SELECT id INTO v_user_b_id FROM auth.users WHERE email = 'member.b@eagles.internal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_b_id) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_user_b_id, v_user_b_id, v_user_b_id::text,
            jsonb_build_object('sub', v_user_b_id::text, 'email', 'member.b@eagles.internal'),
            'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = v_user_b_id) THEN
        INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch)
        VALUES (v_user_b_id, 'member.b@eagles.internal', 'Pedro', 'Beta', 'TEST-MEMBER-B', 'member', 'active', 'Maharlika Chapter')
        ON CONFLICT (email) DO UPDATE 
        SET user_id = v_user_b_id, role = 'member', membership_status = 'active', member_number = 'TEST-MEMBER-B';
    ELSE
        UPDATE public.members 
        SET role = 'member', membership_status = 'active', member_number = 'TEST-MEMBER-B' 
        WHERE user_id = v_user_b_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Officer (Privileged Operations: attendance, verify dues, claim tokens)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'officer@eagles.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_officer_id, 'authenticated', 'authenticated',
            'officer@eagles.internal', v_pwd_hash, timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Kuya","last_name":"Officer"}'::jsonb,
            timezone('utc'::text, now()), timezone('utc'::text, now()),
            '', '', '', ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_pwd_hash,
            email_confirmed_at = timezone('utc'::text, now()),
            confirmation_token = '',
            email_change = '',
            email_change_token_new = '',
            recovery_token = ''
        WHERE email = 'officer@eagles.internal';
        SELECT id INTO v_officer_id FROM auth.users WHERE email = 'officer@eagles.internal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_officer_id) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_officer_id, v_officer_id, v_officer_id::text,
            jsonb_build_object('sub', v_officer_id::text, 'email', 'officer@eagles.internal'),
            'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = v_officer_id) THEN
        INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch)
        VALUES (v_officer_id, 'officer@eagles.internal', 'Kuya', 'Officer', 'TEST-OFFICER-01', 'officer', 'active', 'Bantayog Elite')
        ON CONFLICT (email) DO UPDATE 
        SET user_id = v_officer_id, role = 'officer', membership_status = 'active', member_number = 'TEST-OFFICER-01';
    ELSE
        UPDATE public.members 
        SET role = 'officer', membership_status = 'active', member_number = 'TEST-OFFICER-01' 
        WHERE user_id = v_officer_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Administrator (Full Directory & Roster Privileges)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@eagles.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
            'admin@eagles.internal', v_pwd_hash, timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Chief","last_name":"Admin"}'::jsonb,
            timezone('utc'::text, now()), timezone('utc'::text, now()),
            '', '', '', ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_pwd_hash,
            email_confirmed_at = timezone('utc'::text, now()),
            confirmation_token = '',
            email_change = '',
            email_change_token_new = '',
            recovery_token = ''
        WHERE email = 'admin@eagles.internal';
        SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@eagles.internal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_id) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_admin_id, v_admin_id, v_admin_id::text,
            jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@eagles.internal'),
            'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = v_admin_id) THEN
        INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch)
        VALUES (v_admin_id, 'admin@eagles.internal', 'Chief', 'Admin', 'TEST-ADMIN-01', 'admin', 'active', 'National Executive')
        ON CONFLICT (email) DO UPDATE 
        SET user_id = v_admin_id, role = 'admin', membership_status = 'active', member_number = 'TEST-ADMIN-01';
    ELSE
        UPDATE public.members 
        SET role = 'admin', membership_status = 'active', member_number = 'TEST-ADMIN-01' 
        WHERE user_id = v_admin_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. Suspended Member (Restricted from Active Operations)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'suspended@eagles.internal') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_suspended_id, 'authenticated', 'authenticated',
            'suspended@eagles.internal', v_pwd_hash, timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Suspended","last_name":"User"}'::jsonb,
            timezone('utc'::text, now()), timezone('utc'::text, now()),
            '', '', '', ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_pwd_hash,
            email_confirmed_at = timezone('utc'::text, now()),
            confirmation_token = '',
            email_change = '',
            email_change_token_new = '',
            recovery_token = ''
        WHERE email = 'suspended@eagles.internal';
        SELECT id INTO v_suspended_id FROM auth.users WHERE email = 'suspended@eagles.internal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_suspended_id) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_suspended_id, v_suspended_id, v_suspended_id::text,
            jsonb_build_object('sub', v_suspended_id::text, 'email', 'suspended@eagles.internal'),
            'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = v_suspended_id) THEN
        INSERT INTO public.members (user_id, email, first_name, last_name, member_number, role, membership_status, chapter_or_branch)
        VALUES (v_suspended_id, 'suspended@eagles.internal', 'Suspended', 'User', 'TEST-SUSPENDED-01', 'member', 'suspended', 'Bantayog Elite')
        ON CONFLICT (email) DO UPDATE 
        SET user_id = v_suspended_id, role = 'member', membership_status = 'suspended', member_number = 'TEST-SUSPENDED-01';
    ELSE
        UPDATE public.members 
        SET role = 'member', membership_status = 'suspended', member_number = 'TEST-SUSPENDED-01' 
        WHERE user_id = v_suspended_id;
    END IF;

    -- Ensure FIXTURE-SECURITY-PROBE exists in members for immutability tests
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE member_number = 'FIXTURE-SECURITY-PROBE') THEN
        INSERT INTO public.members (email, first_name, last_name, member_number, role, membership_status)
        VALUES ('security.probe@eagles.internal', 'Probe', 'Fixture', 'FIXTURE-SECURITY-PROBE', 'member', 'active');
    END IF;

    RAISE NOTICE 'SUCCESS: 5 Auth Personas, Identities, and Security Probes provisioned with complete GoTrue schemas.';
END $$;
