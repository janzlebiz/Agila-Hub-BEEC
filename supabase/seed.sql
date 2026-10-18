-- =============================================================================
-- AGILA Hub - Seed Data & Test Fixtures
-- =============================================================================

-- Clean up previous seed records if re-running
DELETE FROM public.audit_logs WHERE details->>'seed' = 'true';
DELETE FROM public.documents WHERE title LIKE '[SEED]%';
DELETE FROM public.contributions WHERE title LIKE '[SEED]%';
DELETE FROM public.attendance WHERE notes = 'Seed record';
DELETE FROM public.events WHERE title LIKE '[SEED]%';
DELETE FROM public.announcements WHERE title LIKE '[SEED]%';
DELETE FROM public.members WHERE email LIKE '%@agilahub.example';

-- -----------------------------------------------------------------------------
-- 1. Pre-registered Directory Members
-- -----------------------------------------------------------------------------

-- Note: When these users sign up in Supabase Auth with these emails,
-- the trigger public.handle_new_user() links them automatically.

INSERT INTO public.members (
    id, email, first_name, last_name, phone, member_number, role, membership_status, chapter_or_branch
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'admin@agilahub.example',
    'Juan',
    'Dela Cruz',
    '+639171112233',
    'AGILA-2024-001',
    'admin',
    'active',
    'National Executive'
),
(
    '00000000-0000-0000-0000-000000000002',
    'treasurer@agilahub.example',
    'Maria',
    'Santos',
    '+639182223344',
    'AGILA-2024-002',
    'officer',
    'active',
    'Finance & Treasury'
),
(
    '00000000-0000-0000-0000-000000000003',
    'secretary@agilahub.example',
    'Ricardo',
    'Reyes',
    '+639193334455',
    'AGILA-2024-003',
    'officer',
    'active',
    'Secretariat & Records'
),
(
    '00000000-0000-0000-0000-000000000004',
    'member@agilahub.example',
    'Antonio',
    'Luna',
    '+639204445566',
    'AGILA-2025-101',
    'member',
    'active',
    'Metro Manila Chapter'
),
(
    '00000000-0000-0000-0000-000000000005',
    'applicant@agilahub.example',
    'Emilio',
    'Aguinaldo',
    '+639215556677',
    'AGILA-TEMP-999',
    'member',
    'pending',
    'Cebu Chapter'
)
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Sample Announcements
-- -----------------------------------------------------------------------------

INSERT INTO public.announcements (
    id, title, content, category, priority, target_role, is_pinned, author_id, published_at
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '[SEED] 2026 Annual National Assembly Announced',
    'Warm greetings fellow Agila! The 2026 Annual National Assembly is scheduled for November 28, 2026. Review the agenda and RSVP via the Events tab.',
    'General',
    'high',
    'member',
    true,
    '00000000-0000-0000-0000-000000000001',
    now()
),
(
    '10000000-0000-0000-0000-000000000002',
    '[SEED] Q3 Dues Remittance and Financial Reconciliation',
    'Reminder to all chapter treasurers: Q3 chapter remit reports are due on the 25th of this month. Please upload the validated bank slip in the Contributions module.',
    'Finance',
    'urgent',
    'officer',
    false,
    '00000000-0000-0000-0000-000000000002',
    now()
);

-- -----------------------------------------------------------------------------
-- 3. Sample Events
-- -----------------------------------------------------------------------------

INSERT INTO public.events (
    id, title, description, event_date, end_date, location, is_virtual, status, checkin_code, checkin_open, created_by
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '[SEED] Monthly General Membership Meeting',
    'Regular monthly meeting to discuss chapter projects, membership welfare, and community initiatives.',
    timezone('utc'::text, now() + interval '3 days'),
    timezone('utc'::text, now() + interval '3 days' + interval '3 hours'),
    'Agila Clubhouse & Conference Hall, QC',
    false,
    'published',
    'AGILA-GMM-2026',
    true,
    '00000000-0000-0000-0000-000000000003'
),
(
    '20000000-0000-0000-0000-000000000002',
    '[SEED] Community Tree Planting & Outreach',
    'Annual environmental sustainability project in coordination with local government units.',
    timezone('utc'::text, now() + interval '14 days'),
    timezone('utc'::text, now() + interval '14 days' + interval '6 hours'),
    'Sierra Madre Protected Watershed',
    false,
    'published',
    'AGILA-TREE-2026',
    false,
    '00000000-0000-0000-0000-000000000001'
);

-- -----------------------------------------------------------------------------
-- 4. Sample Attendance
-- -----------------------------------------------------------------------------

INSERT INTO public.attendance (
    event_id, member_id, status, check_in_method, verified_by, notes
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'present',
    'self_qr',
    '00000000-0000-0000-0000-000000000003',
    'Seed record'
) ON CONFLICT (event_id, member_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Sample Contributions
-- -----------------------------------------------------------------------------

INSERT INTO public.contributions (
    id, member_id, title, category, amount, payment_method, reference_number, status, contribution_date, verified_by, verified_at
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '[SEED] 2026 Annual Membership Dues',
    'Membership Dues',
    2400.00,
    'GCash',
    'GCASH-99882211',
    'verified',
    CURRENT_DATE - 10,
    '00000000-0000-0000-0000-000000000002',
    now()
),
(
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    '[SEED] Community Outreach Pledge',
    'Project Fund',
    1500.00,
    'Bank Transfer',
    'BDO-REF-445566',
    'pending',
    CURRENT_DATE,
    null,
    null
);

-- -----------------------------------------------------------------------------
-- 6. Sample Documents
-- -----------------------------------------------------------------------------

INSERT INTO public.documents (
    id, title, description, category, file_url, file_type, file_size_bytes, access_level, uploaded_by
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    '[SEED] Constitution and By-Laws (2026 Amended)',
    'Official ratified constitution and by-laws governing all AGILA Hub chapters.',
    'Bylaws',
    'https://example.supabase.co/storage/v1/object/public/documents/constitution_2026.pdf',
    'pdf',
    1845000,
    'member',
    '00000000-0000-0000-0000-000000000001'
),
(
    '40000000-0000-0000-0000-000000000002',
    '[SEED] Q3 2026 Executive Financial Report',
    'Detailed ledger breakdown of club assets, expenditures, and chapter balance sheets.',
    'Financial Report',
    'https://example.supabase.co/storage/v1/object/public/documents/financial_report_q3.pdf',
    'pdf',
    892000,
    'officer',
    '00000000-0000-0000-0000-000000000002'
);

-- -----------------------------------------------------------------------------
-- 7. Storage Bucket Definitions
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('club-documents', 'club-documents', false),
    ('contribution-receipts', 'contribution-receipts', false),
    ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;
