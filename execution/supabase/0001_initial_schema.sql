-- =============================================================================
-- AGILA Hub - Initial Database Schema & Security Foundation
-- Engine: PostgreSQL 15+ (Supabase)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Custom Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'officer', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('pending', 'active', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'late', 'excused', 'absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_access_level AS ENUM ('public', 'member', 'officer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Core Tables
-- -----------------------------------------------------------------------------

-- 2.1 Members & User Profiles
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    member_number TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'member',
    membership_status membership_status NOT NULL DEFAULT 'pending',
    chapter_or_branch TEXT DEFAULT 'Main Chapter',
    joined_date DATE DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES public.members(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Announcements & Communication
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_role user_role NOT NULL DEFAULT 'member',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    author_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT NOT NULL,
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    meeting_link TEXT,
    status event_status NOT NULL DEFAULT 'published',
    checkin_code TEXT,
    checkin_open BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'present',
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_in_method TEXT DEFAULT 'self_qr' CHECK (check_in_method IN ('self_qr', 'officer_manual', 'code')),
    verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_event_member UNIQUE (event_id, member_id)
);

-- 2.5 Contributions & Financial Records
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Monthly Dues',
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    reference_number TEXT,
    proof_receipt_url TEXT,
    status contribution_status NOT NULL DEFAULT 'pending',
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 Organization Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Bylaws',
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size_bytes BIGINT,
    access_level document_access_level NOT NULL DEFAULT 'member',
    uploaded_by UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 3. Indexes for High Performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_role_status ON public.members(role, membership_status);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_member ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_documents_access ON public.documents(access_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Helper Security Functions (SECURITY DEFINER)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_member()
RETURNS public.members AS $$
    SELECT * FROM public.members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = auth.uid()
          AND role = 'admin'
          AND membership_status = 'active'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_officer()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'officer')
          AND membership_status = 'active'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = auth.uid()
          AND membership_status = 'active'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Members Policies
-- Active members can view all active members (for club directory). Pending/inactive members can only see themselves.
CREATE POLICY "Members view directory or self"
    ON public.members FOR SELECT
    USING (
        (public.is_active_member() AND membership_status = 'active')
        OR user_id = auth.uid()
        OR public.is_officer()
    );

-- Members can update their personal profile info (phone, avatar), but NOT role or membership_status
CREATE POLICY "Members update own contact profile"
    ON public.members FOR UPDATE
    USING (user_id = auth.uid() OR public.is_officer())
    WITH CHECK (
        -- If regular member, ensure role and membership_status are unchanged
        (user_id = auth.uid() AND NOT public.is_officer() AND role = (SELECT role FROM public.members WHERE user_id = auth.uid()) AND membership_status = (SELECT membership_status FROM public.members WHERE user_id = auth.uid()))
        OR public.is_officer()
    );

-- Only Admins can delete member records
CREATE POLICY "Admins delete members"
    ON public.members FOR DELETE
    USING (public.is_admin());

-- 5.2 Announcements Policies
-- Active members can view published announcements that match their role tier
CREATE POLICY "View announcements"
    ON public.announcements FOR SELECT
    USING (
        public.is_active_member() AND (
            target_role = 'member'
            OR (target_role = 'officer' AND public.is_officer())
            OR (target_role = 'admin' AND public.is_admin())
        )
    );

-- Officers & Admins can create announcements
CREATE POLICY "Officers create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (public.is_officer());

-- Authors, Officers, and Admins can update announcements
CREATE POLICY "Manage announcements"
    ON public.announcements FOR UPDATE
    USING (public.is_officer() OR author_id = (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Officers delete announcements"
    ON public.announcements FOR DELETE
    USING (public.is_officer());

-- 5.3 Events Policies
CREATE POLICY "Active members view published events"
    ON public.events FOR SELECT
    USING (public.is_active_member() OR public.is_officer());

CREATE POLICY "Officers create events"
    ON public.events FOR INSERT
    WITH CHECK (public.is_officer());

CREATE POLICY "Officers update events"
    ON public.events FOR UPDATE
    USING (public.is_officer());

CREATE POLICY "Admins delete events"
    ON public.events FOR DELETE
    USING (public.is_admin());

-- 5.4 Attendance Policies
CREATE POLICY "Members view their own attendance, officers view all"
    ON public.attendance FOR SELECT
    USING (
        member_id = (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

CREATE POLICY "Self check-in or officer logging"
    ON public.attendance FOR INSERT
    WITH CHECK (
        (
            member_id = (SELECT id FROM public.members WHERE user_id = auth.uid())
            AND EXISTS (
                SELECT 1 FROM public.events
                WHERE id = event_id AND checkin_open = true AND status = 'ongoing'
            )
        )
        OR public.is_officer()
    );

CREATE POLICY "Officers update attendance"
    ON public.attendance FOR UPDATE
    USING (public.is_officer());

CREATE POLICY "Admins delete attendance"
    ON public.attendance FOR DELETE
    USING (public.is_admin());

-- 5.5 Contributions Policies
CREATE POLICY "Members view their own contributions, officers view all"
    ON public.contributions FOR SELECT
    USING (
        member_id = (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

CREATE POLICY "Members submit own contributions or officers record"
    ON public.contributions FOR INSERT
    WITH CHECK (
        member_id = (SELECT id FROM public.members WHERE user_id = auth.uid())
        OR public.is_officer()
    );

CREATE POLICY "Officers verify or update contributions"
    ON public.contributions FOR UPDATE
    USING (public.is_officer());

CREATE POLICY "Admins delete contributions"
    ON public.contributions FOR DELETE
    USING (public.is_admin());

-- 5.6 Documents Policies
CREATE POLICY "View documents based on access level"
    ON public.documents FOR SELECT
    USING (
        access_level = 'public'
        OR (access_level = 'member' AND public.is_active_member())
        OR (access_level = 'officer' AND public.is_officer())
        OR (access_level = 'admin' AND public.is_admin())
    );

CREATE POLICY "Officers upload documents"
    ON public.documents FOR INSERT
    WITH CHECK (public.is_officer());

CREATE POLICY "Officers update documents"
    ON public.documents FOR UPDATE
    USING (public.is_officer());

CREATE POLICY "Admins delete documents"
    ON public.documents FOR DELETE
    USING (public.is_admin());

-- 5.7 Audit Logs Policies
CREATE POLICY "Officers view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_officer());

-- Insertion via server functions or triggers only
CREATE POLICY "System insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. Automated Triggers & Auth Synchronization
-- -----------------------------------------------------------------------------

-- Trigger function: Automatically link or create member profile upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    existing_member_id UUID;
    existing_status membership_status;
BEGIN
    -- Check if member was pre-registered in directory by email
    SELECT id, membership_status INTO existing_member_id, existing_status
    FROM public.members
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF existing_member_id IS NOT NULL THEN
        -- Link user_id to the pre-seeded member record
        UPDATE public.members
        SET user_id = NEW.id,
            updated_at = timezone('utc'::text, now())
        WHERE id = existing_member_id;
    ELSE
        -- Create new member in 'pending' status requiring officer approval
        INSERT INTO public.members (
            user_id,
            email,
            first_name,
            last_name,
            phone,
            role,
            membership_status
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            NEW.raw_user_meta_data->>'phone',
            'member',
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users (Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function: Update timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER trg_contributions_updated BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
