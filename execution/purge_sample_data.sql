-- =============================================================================
-- AGILA Hub - Purge Sample / Seed Data & Enable Profile Persistence
-- Script: execution/purge_sample_data.sql
-- =============================================================================

-- 1. Ensure public.members has all required profile columns
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT DEFAULT 'Spouse';

-- 2. Drop any legacy/accidental avatar photo assignment from official_id_url / id_card_front_url
UPDATE public.members
SET 
    official_id_url = NULL
WHERE official_id_url = avatar_url AND avatar_url IS NOT NULL;

UPDATE public.members
SET 
    id_card_front_url = NULL
WHERE id_card_front_url = avatar_url AND avatar_url IS NOT NULL;

-- 3. Delete all seed and dummy sample events, attendance, announcements, and contributions
DELETE FROM public.audit_logs 
WHERE details->>'seed' = 'true' 
   OR details::text ILIKE '%seed%';

DELETE FROM public.attendance 
WHERE notes = 'Seed record' 
   OR notes ILIKE '%seed%'
   OR event_id IN ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002');

DELETE FROM public.events 
WHERE id IN ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
   OR title LIKE '[SEED]%'
   OR title ILIKE '%Monthly General Membership Meeting%'
   OR title ILIKE '%Community Tree Planting%';

DELETE FROM public.announcements 
WHERE id IN ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002')
   OR title LIKE '[SEED]%'
   OR title ILIKE '%Annual National Assembly%'
   OR title ILIKE '%Q3 Dues Remittance%';

DELETE FROM public.contributions 
WHERE id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003')
   OR title LIKE '[SEED]%'
   OR reference_number IN ('GC-2026-10492', 'GC-2026-09114', 'BDO-REF-445566');

DELETE FROM public.documents 
WHERE title LIKE '[SEED]%' 
   OR id LIKE 'doc-tfoe-%';

-- 4. Delete sample members (preserve the 13 canonical BEEC members)
DELETE FROM public.members 
WHERE email LIKE '%@agilahub.example' 
   OR id IN (
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000005'
   );

-- 5. Establish RLS update policy for members to update their profile safely
DROP POLICY IF EXISTS "Members update own profile" ON public.members;
CREATE POLICY "Members update own profile"
    ON public.members FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR email = auth.jwt()->>'email'
        OR public.is_officer()
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR email = auth.jwt()->>'email'
        OR public.is_officer()
    );

-- 6. Set default region for Bantayog Elite Eagles Club
UPDATE public.members
SET chapter_or_branch = 'Bantayog Elite Eagles Club • Bicol Camarines Norte Bantayog Region 1'
WHERE chapter_or_branch IS NULL 
   OR chapter_or_branch = 'Main Chapter'
   OR chapter_or_branch = 'Bantayog Elite Eagles Club';

-- 7. Drop legacy overloaded function without transaction type to prevent PostgREST ambiguity (HTTP 300)
DROP FUNCTION IF EXISTS public.officer_submit_contribution_for_member(uuid, text, text, numeric, text, text, text, boolean);

