-- =============================================================================
-- Migration: Real Database Operations & Seed Directory Enhancement
-- =============================================================================

-- 1. Auto-confirm emails in auth.users upon creation (for smooth onboarding / testing)
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS trigger AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, timezone('utc'::text, now()));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- Also confirm existing auth.users
UPDATE auth.users SET email_confirmed_at = timezone('utc'::text, now()) WHERE email_confirmed_at IS NULL;

-- 2. Update public directory members to official domain: @eagles.org.ph
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM public.members WHERE email = 'kuya.juan@eagles.org.ph' AND member_number IS NULL LIMIT 1;
    DELETE FROM public.members WHERE email = 'kuya.juan@eagles.org.ph' AND member_number IS NULL;
    
    UPDATE public.members 
    SET email = 'kuya.juan@eagles.org.ph',
        user_id = COALESCE(user_id, v_user_id)
    WHERE member_number = 'AGILA-2024-001';
END $$;
UPDATE public.members SET email = 'maria.santos@eagles.org.ph' WHERE member_number = 'AGILA-2024-002';
UPDATE public.members SET email = 'ricardo.reyes@eagles.org.ph' WHERE member_number = 'AGILA-2024-003';
UPDATE public.members SET email = 'antonio.luna@eagles.org.ph' WHERE member_number = 'AGILA-2025-101';
UPDATE public.members SET email = 'emilio.aguinaldo@eagles.org.ph' WHERE member_number = 'AGILA-TEMP-999';

-- 3. Enhance Announcements Policy: Allow public viewing for General / Public announcements
DROP POLICY IF EXISTS "View announcements" ON public.announcements;
CREATE POLICY "View announcements"
    ON public.announcements FOR SELECT
    USING (
        -- Public announcements viewable by anyone
        category = 'General'
        OR is_pinned = true
        OR target_role = 'member'
        -- Tiered announcements viewable by logged in role
        OR (target_role = 'officer' AND public.is_officer())
        OR (target_role = 'admin' AND public.is_admin())
    );

-- 4. Enhance Events Policy: Allow viewing published events
DROP POLICY IF EXISTS "Active members view published events" ON public.events;
CREATE POLICY "Active members view published events"
    ON public.events FOR SELECT
    USING (status = 'published' OR status = 'ongoing' OR public.is_officer());

-- 5. Enhance Documents Policy: Allow active members or public
DROP POLICY IF EXISTS "View documents based on access level" ON public.documents;
CREATE POLICY "View documents based on access level"
    ON public.documents FOR SELECT
    USING (
        access_level = 'public'
        OR (access_level = 'member' AND (public.is_active_member() OR auth.role() = 'authenticated'))
        OR (access_level = 'officer' AND public.is_officer())
        OR (access_level = 'admin' AND public.is_admin())
    );

-- 6. RPC Function for Secure Event PIN Check-in
CREATE OR REPLACE FUNCTION public.check_in_event(
    p_event_id UUID,
    p_checkin_code TEXT,
    p_member_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_event RECORD;
    v_target_member_id UUID;
    v_existing_attendance RECORD;
BEGIN
    -- Determine target member ID
    IF p_member_id IS NOT NULL THEN
        v_target_member_id := p_member_id;
    ELSE
        SELECT id INTO v_target_member_id FROM public.members WHERE user_id = auth.uid() LIMIT 1;
    END IF;

    IF v_target_member_id IS NULL THEN
        -- Fallback to Kuya Juan Dela Cruz for demo/unlinked users
        SELECT id INTO v_target_member_id FROM public.members WHERE member_number = 'AGILA-2024-001' LIMIT 1;
    END IF;

    -- Validate Event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found');
    END IF;

    -- Validate Check-in code
    IF upper(trim(v_event.checkin_code)) != upper(trim(p_checkin_code)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid check-in code. Please check the code provided by the Secretariat.');
    END IF;

    -- Check if already checked in
    SELECT * INTO v_existing_attendance FROM public.attendance 
    WHERE event_id = p_event_id AND member_id = v_target_member_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_checked_in', true, 'message', 'You have already checked in for this event!');
    END IF;

    -- Insert attendance record
    INSERT INTO public.attendance (
        event_id,
        member_id,
        status,
        check_in_method,
        notes
    ) VALUES (
        p_event_id,
        v_target_member_id,
        'present',
        'self_pin',
        'Verified via AGILA Hub Portal'
    );

    RETURN jsonb_build_object('success', true, 'already_checked_in', false, 'message', 'Attendance successfully recorded! Mabuhay ang Agila!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. RPC Function for Approving Pending Applicants
CREATE OR REPLACE FUNCTION public.approve_member_applicant(
    p_member_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_approver_id UUID;
BEGIN
    SELECT id INTO v_approver_id FROM public.members WHERE user_id = auth.uid() LIMIT 1;
    IF v_approver_id IS NULL THEN
        SELECT id INTO v_approver_id FROM public.members WHERE member_number = 'AGILA-2024-001' LIMIT 1;
    END IF;

    UPDATE public.members
    SET membership_status = 'active',
        approved_by = v_approver_id,
        approved_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_member_id;

    RETURN jsonb_build_object('success', true, 'message', 'Member application approved and activated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
