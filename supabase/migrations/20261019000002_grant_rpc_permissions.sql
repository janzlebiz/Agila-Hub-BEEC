-- Grant execute on RPC functions strictly to authenticated users (Revoke anon)
GRANT EXECUTE ON FUNCTION public.check_in_event(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_member_applicant(UUID) TO authenticated;

-- Strict contributions access: Members view own contributions, officers view all
DROP POLICY IF EXISTS "Members view own contributions, officers view all" ON public.contributions;
CREATE POLICY "Members view own contributions, officers view all"
    ON public.contributions FOR SELECT
    TO authenticated
    USING (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

-- Strict member directory access: Active members view directory, users view self, officers view all
DROP POLICY IF EXISTS "Members view approved directory" ON public.members;
CREATE POLICY "Members view approved directory"
    ON public.members FOR SELECT
    TO authenticated
    USING (
        (public.is_active_member() AND membership_status = 'active')
        OR user_id = auth.uid()
        OR public.is_officer()
    );
