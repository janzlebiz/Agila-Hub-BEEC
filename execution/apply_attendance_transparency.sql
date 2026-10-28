-- ==============================================================================
-- AGILA Hub Execution: execution/apply_attendance_transparency.sql
-- Run in Supabase SQL editor to enable chapter-wide attendance visibility
-- ==============================================================================

DROP POLICY IF EXISTS "Members view their own attendance, officers view all" ON public.attendance;
DROP POLICY IF EXISTS "All authenticated members view attendance" ON public.attendance;

CREATE POLICY "All authenticated members view attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Self check-in or officer logging" ON public.attendance;
CREATE POLICY "Self check-in or officer logging"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

DROP POLICY IF EXISTS "Self check-in update or officer logging" ON public.attendance;
CREATE POLICY "Self check-in update or officer logging"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

