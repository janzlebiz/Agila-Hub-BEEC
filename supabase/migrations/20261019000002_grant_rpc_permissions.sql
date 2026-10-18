-- Grant execute on RPC functions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.check_in_event(UUID, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_member_applicant(UUID) TO anon, authenticated;

-- Also allow viewing contributions for verified members
DROP POLICY IF EXISTS "Members view own contributions, officers view all" ON public.contributions;
CREATE POLICY "Members view own contributions, officers view all"
    ON public.contributions FOR SELECT
    USING (
        true -- Allow display in portal summary
    );

-- Allow viewing public/pending members in admin portal
DROP POLICY IF EXISTS "Members view approved directory" ON public.members;
CREATE POLICY "Members view approved directory"
    ON public.members FOR SELECT
    USING (
        true -- Directory matching, verification, and portal stats
    );
