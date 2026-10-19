#!/usr/bin/env python3
"""
Apply Phase 2, Phase 3 & Official Eagles ID Migration to Supabase
"""
import os
import urllib.request
import json
import sys

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "jgpigkeekfuawbyilycq")
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")

SQL_STATEMENTS = """
-- 1. Add Official ID and Profile columns to public.members
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS official_id_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
    ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT 'O+',
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 2. Storage Bucket for ID Cards & Receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Public view receipts and ids"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'receipts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated or Anon upload ids"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'receipts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. RPC to update official Eagles ID scan
CREATE OR REPLACE FUNCTION public.update_member_official_id(
    p_member_id UUID,
    p_id_url TEXT,
    p_front_url TEXT DEFAULT NULL,
    p_back_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.members
    SET 
        official_id_url = COALESCE(p_id_url, official_id_url),
        id_card_front_url = COALESCE(p_front_url, p_id_url, id_card_front_url),
        id_card_back_url = COALESCE(p_back_url, id_card_back_url),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_member_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Official Eagles ID updated successfully'
    );
END;
$$;

-- 4. RPC to update member personal and emergency profile
CREATE OR REPLACE FUNCTION public.update_member_profile(
    p_member_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_blood_type TEXT DEFAULT NULL,
    p_emergency_name TEXT DEFAULT NULL,
    p_emergency_phone TEXT DEFAULT NULL,
    p_chapter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.members
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        phone = COALESCE(p_phone, phone),
        blood_type = COALESCE(p_blood_type, blood_type),
        emergency_contact_name = COALESCE(p_emergency_name, emergency_contact_name),
        emergency_contact_phone = COALESCE(p_emergency_phone, emergency_contact_phone),
        chapter_or_branch = COALESCE(p_chapter, chapter_or_branch),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_member_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile details updated successfully'
    );
END;
$$;

-- 5. Enable Supabase Realtime for attendance, contributions, and announcements
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
"""

def main():
    print(f"Applying migration to Supabase project {PROJECT_REF}...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = json.dumps({"query": SQL_STATEMENTS}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            print("Migration applied successfully!")
            print(data[:300])
            return 0
    except Exception as e:
        print(f"Error applying migration: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
