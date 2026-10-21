-- =============================================================================
-- SQL Script: execution/setup_e2e_testing_personas.sql
-- Description: Provision E2E Testing Personas & Enable Admin Member Creation
-- Target Supabase Project: jgpigkeekfuawbyilycq
--
-- Personas Provisioned:
--   1. Club President  : president@agilahub.ph (AgilaPresident2026!) -> admin
--   2. Treasurer       : treasurer@agilahub.ph (AgilaTreasurer2026!) -> officer
--   3. Secretary       : secretary@agilahub.ph (AgilaSecretary2026!) -> officer
--   4. Club Member     : member@agilahub.ph    (AgilaMember2026!)    -> member
--
-- Instructions: Run in Supabase Dashboard -> SQL Editor
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_pwd_pres TEXT;
    v_pwd_treas TEXT;
    v_pwd_sec TEXT;
    v_pwd_mem TEXT;

    v_pres_id UUID  := 'b0000000-0000-0000-0000-000000000001';
    v_treas_id UUID := 'b0000000-0000-0000-0000-000000000002';
    v_sec_id UUID   := 'b0000000-0000-0000-0000-000000000003';
    v_mem_id UUID   := 'b0000000-0000-0000-0000-000000000004';
BEGIN
    -- 1. Compute individual bcrypt password hashes
    v_pwd_pres  := extensions.crypt('AgilaPresident2026!', extensions.gen_salt('bf', 10));
    v_pwd_treas := extensions.crypt('AgilaTreasurer2026!', extensions.gen_salt('bf', 10));
    v_pwd_sec   := extensions.crypt('AgilaSecretary2026!', extensions.gen_salt('bf', 10));
    v_pwd_mem   := extensions.crypt('AgilaMember2026!',    extensions.gen_salt('bf', 10));

    -- 2. Clear circular foreign keys before deletions
    UPDATE public.members SET approved_by = NULL;

    -- 3. Delete old administrator credentials & obsolete probe accounts
    DELETE FROM public.members 
    WHERE email IN (
        'admin@agilahub.ph',
        'admin@eagles.internal',
        'juan@agilahub.example',
        'admin@agilahub.example',
        'kuya.juan@eagles.org.ph'
    ) OR member_number = 'AGILA-ADMIN-001';

    DELETE FROM auth.users 
    WHERE email IN (
        'admin@agilahub.ph',
        'admin@eagles.internal',
        'juan@agilahub.example',
        'admin@agilahub.example',
        'kuya.juan@eagles.org.ph'
    );

    -- Delete any previous test persona rows to ensure clean state
    DELETE FROM public.members WHERE email IN (
        'president@agilahub.ph',
        'treasurer@agilahub.ph',
        'secretary@agilahub.ph',
        'member@agilahub.ph'
    );

    DELETE FROM auth.users WHERE email IN (
        'president@agilahub.ph',
        'treasurer@agilahub.ph',
        'secretary@agilahub.ph',
        'member@agilahub.ph'
    );

    -- -------------------------------------------------------------------------
    -- 4. Insert Persona 1: Club President (Admin)
    -- -------------------------------------------------------------------------
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_pres_id, 'authenticated', 'authenticated',
        'president@agilahub.ph', v_pwd_pres, timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"first_name":"Juan","last_name":"Dela Cruz","role":"admin"}'::jsonb,
        timezone('utc'::text, now()), timezone('utc'::text, now()),
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_pres_id, v_pres_id, v_pres_id::text,
        jsonb_build_object('sub', v_pres_id::text, 'email', 'president@agilahub.ph'),
        'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
    );

    INSERT INTO public.members (
        user_id, email, first_name, last_name, member_number, role,
        membership_status, chapter_or_branch, blood_type, phone
    ) VALUES (
        v_pres_id, 'president@agilahub.ph', 'Juan', 'Dela Cruz', 'BEEC-2024-001', 'admin',
        'active', 'Bantayog Elite Eagles Club', 'O+', '+639171230001'
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = v_pres_id, role = 'admin', membership_status = 'active',
        first_name = 'Juan', last_name = 'Dela Cruz', member_number = 'BEEC-2024-001';

    -- -------------------------------------------------------------------------
    -- 5. Insert Persona 2: Treasurer (Officer)
    -- -------------------------------------------------------------------------
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_treas_id, 'authenticated', 'authenticated',
        'treasurer@agilahub.ph', v_pwd_treas, timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"first_name":"Maria","last_name":"Santos","role":"officer"}'::jsonb,
        timezone('utc'::text, now()), timezone('utc'::text, now()),
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_treas_id, v_treas_id, v_treas_id::text,
        jsonb_build_object('sub', v_treas_id::text, 'email', 'treasurer@agilahub.ph'),
        'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
    );

    INSERT INTO public.members (
        user_id, email, first_name, last_name, member_number, role,
        membership_status, chapter_or_branch, blood_type, phone
    ) VALUES (
        v_treas_id, 'treasurer@agilahub.ph', 'Maria', 'Santos', 'BEEC-2024-002', 'officer',
        'active', 'Bantayog Elite Eagles Club', 'A+', '+639181230002'
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = v_treas_id, role = 'officer', membership_status = 'active',
        first_name = 'Maria', last_name = 'Santos', member_number = 'BEEC-2024-002';

    -- -------------------------------------------------------------------------
    -- 6. Insert Persona 3: Secretary (Officer)
    -- -------------------------------------------------------------------------
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_sec_id, 'authenticated', 'authenticated',
        'secretary@agilahub.ph', v_pwd_sec, timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"first_name":"Ricardo","last_name":"Reyes","role":"officer"}'::jsonb,
        timezone('utc'::text, now()), timezone('utc'::text, now()),
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_sec_id, v_sec_id, v_sec_id::text,
        jsonb_build_object('sub', v_sec_id::text, 'email', 'secretary@agilahub.ph'),
        'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
    );

    INSERT INTO public.members (
        user_id, email, first_name, last_name, member_number, role,
        membership_status, chapter_or_branch, blood_type, phone
    ) VALUES (
        v_sec_id, 'secretary@agilahub.ph', 'Ricardo', 'Reyes', 'BEEC-2024-003', 'officer',
        'active', 'Bantayog Elite Eagles Club', 'B+', '+639191230003'
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = v_sec_id, role = 'officer', membership_status = 'active',
        first_name = 'Ricardo', last_name = 'Reyes', member_number = 'BEEC-2024-003';

    -- -------------------------------------------------------------------------
    -- 7. Insert Persona 4: Normal Club Member (Member)
    -- -------------------------------------------------------------------------
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_mem_id, 'authenticated', 'authenticated',
        'member@agilahub.ph', v_pwd_mem, timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"first_name":"Antonio","last_name":"Luna","role":"member"}'::jsonb,
        timezone('utc'::text, now()), timezone('utc'::text, now()),
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_mem_id, v_mem_id, v_mem_id::text,
        jsonb_build_object('sub', v_mem_id::text, 'email', 'member@agilahub.ph'),
        'email', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now())
    );

    INSERT INTO public.members (
        user_id, email, first_name, last_name, member_number, role,
        membership_status, chapter_or_branch, blood_type, phone
    ) VALUES (
        v_mem_id, 'member@agilahub.ph', 'Antonio', 'Luna', 'BEEC-2025-101', 'member',
        'active', 'Bantayog Elite Eagles Club', 'O+', '+639201230004'
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = v_mem_id, role = 'member', membership_status = 'active',
        first_name = 'Antonio', last_name = 'Luna', member_number = 'BEEC-2025-101';

END $$;

-- -----------------------------------------------------------------------------
-- 8. Add Member RPC: Allows President / Officers to Register New Members
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_add_member(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_member_number TEXT DEFAULT NULL,
    p_role user_role DEFAULT 'member',
    p_chapter TEXT DEFAULT 'Bantayog Elite Eagles Club'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_new_id UUID;
    v_num TEXT;
BEGIN
    -- Check authentication
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Verify caller is active officer or admin
    SELECT id INTO v_caller_id 
    FROM public.members 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active Club Officers or Club President can register new members.';
    END IF;

    IF p_email IS NULL OR trim(p_email) = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Member email address is required.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.members WHERE email = lower(trim(p_email))) THEN
        RETURN jsonb_build_object('success', false, 'message', 'A member with this email already exists in the roster.');
    END IF;

    IF p_member_number IS NULL OR trim(p_member_number) = '' THEN
        v_num := 'BEEC-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900) + 100)::text, 3, '0');
    ELSE
        v_num := trim(p_member_number);
    END IF;

    INSERT INTO public.members (
        first_name,
        last_name,
        email,
        phone,
        member_number,
        role,
        membership_status,
        chapter_or_branch,
        approved_by,
        approved_at
    ) VALUES (
        trim(p_first_name),
        trim(p_last_name),
        lower(trim(p_email)),
        p_phone,
        v_num,
        p_role,
        'active',
        COALESCE(p_chapter, 'Bantayog Elite Eagles Club'),
        v_caller_id,
        now()
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Member registered successfully.',
        'member_id', v_new_id,
        'member_number', v_num
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_member TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. RLS Policy: Allow Officers/Admins to INSERT directly into public.members
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE POLICY "Officers and Admins can insert members"
        ON public.members FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.members m
                WHERE m.user_id = auth.uid()
                  AND m.role IN ('admin', 'officer')
                  AND m.membership_status = 'active'
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
