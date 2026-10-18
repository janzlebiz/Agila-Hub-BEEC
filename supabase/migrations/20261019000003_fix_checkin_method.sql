-- Update check_in_event to use 'code' for check_in_method
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

    -- Insert attendance record with allowed check_in_method: 'code'
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
        'code',
        'Verified via AGILA Hub Portal'
    );

    RETURN jsonb_build_object('success', true, 'already_checked_in', false, 'message', 'Attendance successfully recorded! Mabuhay ang Agila!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
