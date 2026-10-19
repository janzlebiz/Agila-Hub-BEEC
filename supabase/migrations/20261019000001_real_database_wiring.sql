-- =============================================================================
-- Migration: Real Database Operations & Seed Directory Enhancement
-- =============================================================================

-- 1. Update public directory members to official domain: @eagles.org.ph
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

-- 2. Enhance Announcements Policy: Allow public viewing for General / Public announcements
DROP POLICY IF EXISTS "View announcements" ON public.announcements;
CREATE POLICY "View announcements"
    ON public.announcements FOR SELECT
    USING (
        category = 'General'
        OR is_pinned = true
        OR target_role = 'member'
        OR (target_role = 'officer' AND public.is_officer())
        OR (target_role = 'admin' AND public.is_admin())
    );

-- 3. Enhance Events Policy: Allow viewing published events
DROP POLICY IF EXISTS "Active members view published events" ON public.events;
CREATE POLICY "Active members view published events"
    ON public.events FOR SELECT
    USING (status = 'published' OR status = 'ongoing' OR public.is_officer());

-- 4. Enhance Documents Policy: Allow active members or public
DROP POLICY IF EXISTS "View documents based on access level" ON public.documents;
CREATE POLICY "View documents based on access level"
    ON public.documents FOR SELECT
    USING (
        access_level = 'public'
        OR (access_level = 'member' AND (public.is_active_member() OR auth.role() = 'authenticated'))
        OR (access_level = 'officer' AND public.is_officer())
        OR (access_level = 'admin' AND public.is_admin())
    );

-- 5. RPC Function for Secure Event PIN Check-in (Strict auth & window checks, no arbitrary fallback)
CREATE OR REPLACE FUNCTION public.check_in_event(
    p_event_id UUID,
    p_checkin_code TEXT,
    p_member_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_caller_member_id UUID;
    v_caller_status membership_status;
    v_caller_role user_role;
    v_target_member_id UUID;
    v_event RECORD;
    v_existing_attendance RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required to check in.');
    END IF;

    SELECT id, membership_status, role INTO v_caller_member_id, v_caller_status, v_caller_role
    FROM public.members
    WHERE user_id = auth.uid();

    IF v_caller_member_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Member account profile not found for authenticated user.');
    END IF;

    IF v_caller_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only active members can check in to assemblies.');
    END IF;

    IF v_caller_role IN ('admin', 'officer') AND p_member_id IS NOT NULL THEN
        v_target_member_id := p_member_id;
    ELSE
        v_target_member_id := v_caller_member_id;
    END IF;

    -- Validate Event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Assembly event not found.');
    END IF;

    IF v_event.status NOT IN ('published', 'ongoing') OR v_event.checkin_open IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in is currently closed for this assembly.');
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

-- 6. RPC Function for Approving Pending Applicants (Server-side officer verification)
CREATE OR REPLACE FUNCTION public.approve_member_applicant(
    p_member_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_approver_id UUID;
    v_target_status membership_status;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    SELECT id INTO v_approver_id 
    FROM public.members 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'officer') 
      AND membership_status = 'active';

    IF v_approver_id IS NULL THEN
        RAISE EXCEPTION 'Forbidden: Only active officers or administrators can approve member applications.';
    END IF;

    SELECT membership_status INTO v_target_status
    FROM public.members
    WHERE id = p_member_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Applicant record not found.');
    END IF;

    IF v_target_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Target member is not in pending status.');
    END IF;

    UPDATE public.members
    SET membership_status = 'active',
        approved_by = v_approver_id,
        approved_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_member_id AND membership_status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No pending records were updated.');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Member application approved and activated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
