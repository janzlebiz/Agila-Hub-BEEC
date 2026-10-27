-- =============================================================================
-- AGILA Hub - Financials & Outside Contributions Transparency Migration
-- Execution script: apply_financials_transparency.sql
-- =============================================================================

DROP POLICY IF EXISTS "Strict contributions visibility" ON public.contributions;
CREATE POLICY "Strict contributions visibility"
    ON public.contributions FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
        OR category = 'Alalayang Agila'
        OR category LIKE 'Expense - %'
        OR category = 'Outside Contribution'
        OR category = 'External Sponsorship'
        OR category = 'External Donation'
        OR category = 'Outside Donation'
        OR title LIKE '[GRANT]%'
        OR title LIKE '[EXPENSE]%'
        OR title LIKE '[OUTSIDE]%'
        OR title LIKE '[EXTERNAL]%'
        OR title LIKE '[SPONSOR]%'
    );
