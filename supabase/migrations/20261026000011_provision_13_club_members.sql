-- =============================================================================
-- Migration: 20261026000011_provision_13_club_members.sql
-- Description: Provision Auth Accounts & Canonical Profiles for 13 Named Club Members
-- 
-- Credentials Rule (Directive):
--   - Username: Member ID (e.g. '019528') -> maps to <member_id>@agilahub.ph
--   - Initial Password: lastname + member id (e.g. 'camacho019528')
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    r RECORD;
    v_pwd TEXT;
    v_user_id UUID;
    v_member_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    FOR r IN (
        SELECT 
            '019526' AS member_number,
            'ALLAN G.' AS first_name,
            'CALAYAN' AS last_name,
            '019526@agilahub.ph' AS email,
            'calayan019526' AS raw_password,
            'Club Alt. Assemblyman' AS club_position,
            'member'::public.user_role AS role
        UNION ALL
        SELECT 
            '019528',
            'CHESTER JAN T.',
            'CAMACHO',
            '019528@agilahub.ph',
            'camacho019528',
            'Club Secretary / Club Information Officer / Regional Assemblyman / BOD Member',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '112124',
            'DIVINO RAY A.',
            'PEREZ',
            '112124@agilahub.ph',
            'perez112124',
            'Club Care Chairman',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019536',
            'EDWIN T.',
            'ALEGRE',
            '019536@agilahub.ph',
            'alegre019536',
            'Regional Assemblyman',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019527',
            'ELISEO D.',
            'EBDANI',
            '019527@agilahub.ph',
            'ebdani019527',
            'Club Grievance Member / BOD Member',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019583',
            'GENMIL M.',
            'RAIT',
            '019583@agilahub.ph',
            'rait019583',
            'Club Vice President / Community Service Chairman / Membership Chairman / BOD Member',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019584',
            'JERIC R.',
            'MAGO',
            '019584@agilahub.ph',
            'mago019584',
            'Club Auditor',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019582',
            'JOENATHAN L.',
            'TALENTO',
            '019582@agilahub.ph',
            'talento019582',
            'Club Treasurer / Club Peace Officer / Alalayang Agila Chairman / Community Service Member',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '006344',
            'JOY M.',
            'ARAGON',
            '006344@agilahub.ph',
            'aragon006344',
            'Club President / Club Grievance Chairman / BOD Chairman',
            'admin'::public.user_role
        UNION ALL
        SELECT 
            '006345',
            'MARC POL R.',
            'QUIOZON',
            '006345@agilahub.ph',
            'quiozon006345',
            'Club COMELEC Chairman / Club Alt. Assemblyman / Sport Coordinator',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019586',
            'RANDY B.',
            'DELFINADO',
            '019586@agilahub.ph',
            'delfinado019586',
            'Club Protocol Officer',
            'officer'::public.user_role
        UNION ALL
        SELECT 
            '019587',
            'ROLDAN B.',
            'ROJAS',
            '019587@agilahub.ph',
            'rojas019587',
            'Club Peace Officer / Membership Member',
            'member'::public.user_role
        UNION ALL
        SELECT 
            '019588',
            'STEWARD J.',
            'GARDOSE',
            '019588@agilahub.ph',
            'gardose019588',
            'Club Protocol Officer',
            'officer'::public.user_role
    ) LOOP
        -- 1. Compute bcrypt password hash for initial credentials
        v_pwd := extensions.crypt(r.raw_password, extensions.gen_salt('bf', 10));

        -- 2. Upsert into auth.users
        SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(r.email) LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            UPDATE auth.users
            SET encrypted_password = v_pwd,
                email_confirmed_at = COALESCE(email_confirmed_at, v_now),
                raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
                raw_user_meta_data = jsonb_build_object(
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'member_number', r.member_number,
                    'role', r.role::text,
                    'club_position', r.club_position
                ),
                updated_at = v_now
            WHERE id = v_user_id;
        ELSE
            v_user_id := gen_random_uuid();

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
                    'member_number', r.member_number,
                    'role', r.role::text,
                    'club_position', r.club_position
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
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', lower(r.email)),
            'email',
            v_user_id::text,
            v_now,
            v_now,
            v_now
        );

        -- 4. Upsert into public.members
        SELECT id INTO v_member_id FROM public.members WHERE member_number = r.member_number OR lower(email) = lower(r.email) LIMIT 1;

        IF v_member_id IS NOT NULL THEN
            UPDATE public.members
            SET user_id = v_user_id,
                email = lower(r.email),
                first_name = r.first_name,
                last_name = r.last_name,
                member_number = r.member_number,
                role = r.role,
                club_position = r.club_position,
                membership_status = 'active',
                chapter_or_branch = 'Bantayog Elite Eagles Club',
                updated_at = v_now
            WHERE id = v_member_id;
        ELSE
            INSERT INTO public.members (
                id,
                user_id,
                email,
                first_name,
                last_name,
                member_number,
                role,
                club_position,
                membership_status,
                chapter_or_branch,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                lower(r.email),
                r.first_name,
                r.last_name,
                r.member_number,
                r.role,
                r.club_position,
                'active',
                'Bantayog Elite Eagles Club',
                v_now,
                v_now
            );
        END IF;
    END LOOP;
END $$;
