-- =============================================================================
-- AGILA Hub - Assemblies, Outreach & Financial Transparency Policy Migration
-- Migration: 20261028000001_assemblies_and_activities.sql
-- =============================================================================

-- 1. Ensure Alalayang Agila Grants and Chapter Expenses are visible to all authenticated members
DROP POLICY IF EXISTS "Strict contributions visibility" ON public.contributions;
CREATE POLICY "Strict contributions visibility"
    ON public.contributions FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
        OR category = 'Alalayang Agila'
        OR category LIKE 'Expense - %'
        OR title LIKE '[GRANT]%'
        OR title LIKE '[EXPENSE]%'
    );

-- 2. Allow Officers to delete contributions (e.g. Alalayang Agila grants, expenditures)
DROP POLICY IF EXISTS "Officers delete contributions" ON public.contributions;
CREATE POLICY "Officers delete contributions"
    ON public.contributions FOR DELETE
    TO authenticated
    USING (
        public.is_officer()
        OR member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    );

-- 3. Allow Officers to delete scheduled events and activities
DROP POLICY IF EXISTS "Officers delete events" ON public.events;
CREATE POLICY "Officers delete events"
    ON public.events FOR DELETE
    TO authenticated
    USING (
        public.is_officer()
        OR created_by IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    );

-- 4. Purge the 5 legacy seed personas from public.members so only genuine 13 members remain
DELETE FROM public.contributions WHERE member_id IN (
    SELECT id FROM public.members WHERE email IN (
        'president@agilahub.ph',
        'treasurer@agilahub.ph',
        'secretary@agilahub.ph',
        'admin@agilahub.ph',
        'member@agilahub.ph'
    )
);

DELETE FROM public.attendance WHERE member_id IN (
    SELECT id FROM public.members WHERE email IN (
        'president@agilahub.ph',
        'treasurer@agilahub.ph',
        'secretary@agilahub.ph',
        'admin@agilahub.ph',
        'member@agilahub.ph'
    )
);

DELETE FROM public.events WHERE created_by IN (
    SELECT id FROM public.members WHERE email IN (
        'president@agilahub.ph',
        'treasurer@agilahub.ph',
        'secretary@agilahub.ph',
        'admin@agilahub.ph',
        'member@agilahub.ph'
    )
);

DELETE FROM public.members WHERE email IN (
    'president@agilahub.ph',
    'treasurer@agilahub.ph',
    'secretary@agilahub.ph',
    'admin@agilahub.ph',
    'member@agilahub.ph'
);
