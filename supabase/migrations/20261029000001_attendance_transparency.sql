-- ==============================================================================
-- AGILA Hub Migration: 20261029000001_attendance_transparency.sql
-- Grants chapter-wide viewing permissions for assembly attendance records
-- and self-checkin/RSVP management for all authenticated club members.
-- ==============================================================================

-- 1. Ensure Attendance Table RLS enables all club members to view verified attendance
DROP POLICY IF EXISTS "Members view their own attendance, officers view all" ON public.attendance;
DROP POLICY IF EXISTS "All authenticated members view attendance" ON public.attendance;

CREATE POLICY "All authenticated members view attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow authenticated members to record their own RSVP/attendance (or officers for any member)
DROP POLICY IF EXISTS "Self check-in or officer logging" ON public.attendance;
CREATE POLICY "Self check-in or officer logging"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

-- 3. Allow authenticated members to update their own attendance/RSVP (e.g. excuse / reasons)
DROP POLICY IF EXISTS "Self check-in update or officer logging" ON public.attendance;
CREATE POLICY "Self check-in update or officer logging"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

