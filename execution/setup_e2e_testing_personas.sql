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
    r RECORD;
    v_pwd TEXT;
    v_user_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- Prevent unique member_number conflicts if test numbers were temporarily assigned to other records
    UPDATE public.members 
    SET member_number = NULL 
    WHERE member_number IN ('BEEC-2024-001', 'BEEC-2024-002', 'BEEC-2024-003', 'BEEC-2025-101') 
      AND email NOT IN ('president@agilahub.ph', 'treasurer@agilahub.ph', 'secretary@agilahub.ph', 'member@agilahub.ph');

    -- Iterate through the 4 personas and perform idempotent upserts
    -- (NO DELETIONS that could trigger foreign key constraint violations on announcements/events)
    FOR r IN (
        SELECT 
            'president@agilahub.ph' AS email,
            'AgilaPresident2026!' AS raw_password,
            'Juan' AS first_name,
            'Dela Cruz' AS last_name,
            'BEEC-2024-001' AS member_number,
            'admin'::public.user_role AS role,
            'O+' AS blood_type,
            '+639171230001' AS phone,
            'b0000000-0000-0000-0000-000000000001'::UUID AS default_id
        UNION ALL
        SELECT 
            'treasurer@agilahub.ph',
            'AgilaTreasurer2026!',
            'Maria',
            'Santos',
            'BEEC-2024-002',
            'officer'::public.user_role,
            'A+',
            '+639181230002',
            'b0000000-0000-0000-0000-000000000002'::UUID
        UNION ALL
        SELECT 
            'secretary@agilahub.ph',
            'AgilaSecretary2026!',
            'Ricardo',
            'Reyes',
            'BEEC-2024-003',
            'officer'::public.user_role,
            'B+',
            '+639191230003',
            'b0000000-0000-0000-0000-000000000003'::UUID
        UNION ALL
        SELECT 
            'member@agilahub.ph',
            'AgilaMember2026!',
            'Antonio',
            'Luna',
            'BEEC-2025-101',
            'member'::public.user_role,
            'O+',
            '+639201230004',
            'b0000000-0000-0000-0000-000000000004'::UUID
    ) LOOP
        -- 1. Compute bcrypt password hash
        v_pwd := extensions.crypt(r.raw_password, extensions.gen_salt('bf', 10));

        -- 2. Find or insert into auth.users
        SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(r.email) LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            UPDATE auth.users
            SET encrypted_password = v_pwd,
                email_confirmed_at = COALESCE(email_confirmed_at, v_now),
                raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
                raw_user_meta_data = jsonb_build_object(
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'role', r.role::text
                ),
                updated_at = v_now
            WHERE id = v_user_id;
        ELSE
            v_user_id := r.default_id;

            IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
                v_user_id := gen_random_uuid();
            END IF;

            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                v_user_id,
                'authenticated',
                'authenticated',
                lower(r.email),
                v_pwd,
                v_now,
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object(
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'role', r.role::text
                ),
                v_now,
                v_now,
                '', '', '', ''
            );
        END IF;

        -- 3. Upsert into auth.identities
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            v_user_id::text,
            jsonb_build_object('sub', v_user_id::text, 'email', lower(r.email)),
            'email',
            v_now,
            v_now,
            v_now
        );

        -- 4. Upsert into public.members
        IF EXISTS (SELECT 1 FROM public.members WHERE lower(email) = lower(r.email)) THEN
            UPDATE public.members
            SET user_id = v_user_id,
                first_name = r.first_name,
                last_name = r.last_name,
                role = r.role,
                membership_status = 'active',
                member_number = r.member_number,
                chapter_or_branch = 'Bantayog Elite Eagles Club',
                blood_type = r.blood_type,
                phone = r.phone,
                updated_at = v_now
            WHERE lower(email) = lower(r.email);
        ELSE
            IF EXISTS (SELECT 1 FROM public.members WHERE user_id = v_user_id) THEN
                UPDATE public.members
                SET email = lower(r.email),
                    first_name = r.first_name,
                    last_name = r.last_name,
                    role = r.role,
                    membership_status = 'active',
                    member_number = r.member_number,
                    chapter_or_branch = 'Bantayog Elite Eagles Club',
                    blood_type = r.blood_type,
                    phone = r.phone,
                    updated_at = v_now
                WHERE user_id = v_user_id;
            ELSE
                INSERT INTO public.members (
                    user_id,
                    email,
                    first_name,
                    last_name,
                    member_number,
                    role,
                    membership_status,
                    chapter_or_branch,
                    blood_type,
                    phone
                ) VALUES (
                    v_user_id,
                    lower(r.email),
                    r.first_name,
                    r.last_name,
                    r.member_number,
                    r.role,
                    'active',
                    'Bantayog Elite Eagles Club',
                    r.blood_type,
                    r.phone
                );
            END IF;
        END IF;

    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Add Member RPC: Allows President / Officers to Register New Members
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
-- 6. RLS Policy: Allow Officers/Admins to INSERT directly into public.members
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Officers and Admins can insert members" ON public.members;
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
