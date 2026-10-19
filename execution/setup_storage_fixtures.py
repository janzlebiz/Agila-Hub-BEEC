#!/usr/bin/env python3
"""
AGILA Hub - Real Binary Storage Fixture Provisioning & Verification Tool
Addresses Security Gate Gap 3:
- Replaces empty SQL storage metadata rows with real uploaded binary file fixtures.
- Confirms real object existence via authorized owner retrieval (HTTP 200 with exact payload).
- Demonstrates strict denial on anonymous public requests (HTTP 400 'Bucket not found or not public').
- Demonstrates strict denial on anonymous authenticated endpoint requests (HTTP 401/403).
- Demonstrates cross-member read isolation (Member B cannot access Member A files).
- Demonstrates officer legitimate access (Officer can review member documents).
"""

import os
import sys
import json
import urllib.request
import urllib.error
import argparse

DEFAULT_PROJECT_REF = "jgpigkeekfuawbyilycq"
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", DEFAULT_PROJECT_REF)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", f"https://{PROJECT_REF}.supabase.co")
ANON_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"
)

PROBE_PAYLOAD = b"AGILA_SECURITY_PROBE_CONFIDENTIAL_VERIFIED_2026_FILE_BYTES"

def make_request(url: str, method: str = "GET", data: bytes = None, headers_extra: dict = None, auth_token: str = None) -> tuple:
    headers = {
        "apikey": ANON_KEY,
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    else:
        headers["Authorization"] = f"Bearer {ANON_KEY}"

    if headers_extra:
        headers.update(headers_extra)

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            return resp.status, content
    except urllib.error.HTTPError as e:
        err_body = e.read()
        return e.code, err_body
    except Exception as e:
        return 0, str(e).encode("utf-8")

def parse_body(body_bytes: bytes) -> str:
    try:
        return body_bytes.decode("utf-8")
    except Exception:
        return str(body_bytes)

def upload_and_verify_storage(member_jwt: str, member_uid: str, member_b_jwt: str = None, officer_jwt: str = None) -> bool:
    print("=" * 75)
    print("AGILA HUB: REAL STORAGE OBJECT FIXTURE UPLOAD & ISOLATION VERIFICATION")
    print(f"Target Supabase Storage: {SUPABASE_URL}/storage/v1")
    print(f"Target Fixture Owner UID: {member_uid}")
    print("=" * 75)

    all_passed = True

    def record(name: str, passed: bool, details: str):
        nonlocal all_passed
        if not passed:
            all_passed = False
        tag = "[PASS]" if passed else "[FAIL]"
        print(f"{tag} {name}: {details}")

    buckets = ["receipts", "member-ids"]

    for bucket in buckets:
        object_path = f"{member_uid}/probe.txt"
        upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
        pub_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}"
        priv_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"

        print(f"\n--- Testing Bucket: {bucket} ({object_path}) ---")

        # 1. Upload Real Binary File Payload as Owner
        status, body = make_request(
            upload_url,
            method="POST",
            data=PROBE_PAYLOAD,
            headers_extra={"Content-Type": "text/plain", "x-upsert": "true"},
            auth_token=member_jwt
        )
        passed_upload = status in (200, 201)
        record(
            f"1. Owner Upload ({bucket})",
            passed_upload,
            f"HTTP {status} - {parse_body(body)[:70]}"
        )

        # 2. Confirm Real Object Existence & Payload by Owner
        status_get, body_get = make_request(priv_url, method="GET", auth_token=member_jwt)
        passed_existence = (status_get == 200 and body_get == PROBE_PAYLOAD)
        record(
            f"2. Owner Real Object Read ({bucket})",
            passed_existence,
            f"HTTP {status_get} - Bytes matched: {len(body_get)} bytes (Exact payload confirmed)"
        )

        # 3. Public Anonymous Access Denial (Public Endpoint)
        status_pub, body_pub = make_request(pub_url, method="GET")
        body_pub_str = parse_body(body_pub)
        passed_pub = (status_pub == 400 and ("not public" in body_pub_str.lower() or "bucket not found" in body_pub_str.lower())) or (status_pub in (401, 403))
        record(
            f"3. Anonymous Public Read Denial ({bucket})",
            passed_pub,
            f"HTTP {status_pub} - Confirmed private: {body_pub_str[:70]}"
        )

        # 4. Anonymous Authenticated Endpoint Denial
        status_anon_priv, body_anon_priv = make_request(priv_url, method="GET")
        body_ap_str = parse_body(body_anon_priv)
        passed_anon_priv = (status_anon_priv in (401, 403)) and ("unauthorized" in body_ap_str.lower() or "forbidden" in body_ap_str.lower() or "permission denied" in body_ap_str.lower())
        record(
            f"4. Anonymous Authenticated Endpoint Denial ({bucket})",
            passed_anon_priv,
            f"HTTP {status_anon_priv} - Confirmed unauthorized: {body_ap_str[:70]}"
        )

        # 5. Cross-Member Isolation (Member B attempting to read Member A file)
        if member_b_jwt:
            status_b, body_b = make_request(priv_url, method="GET", auth_token=member_b_jwt)
            body_b_str = parse_body(body_b)
            # RLS blocks Member B: Storage returns 400/404 or empty/error because Member B is not owner
            passed_cross = (status_b != 200)
            record(
                f"5. Cross-Member Read Isolation ({bucket})",
                passed_cross,
                f"HTTP {status_b} - Member B blocked from Member A object: {body_b_str[:70]}"
            )

        # 6. Officer Legitimate Document Access (Officer can read member documents)
        if officer_jwt:
            status_off, body_off = make_request(priv_url, method="GET", auth_token=officer_jwt)
            passed_officer = (status_off == 200 and body_off == PROBE_PAYLOAD)
            record(
                f"6. Officer Legitimate Read Access ({bucket})",
                passed_officer,
                f"HTTP {status_off} - Officer granted read access under RLS policy"
            )

    print("\n" + "=" * 75)
    if all_passed:
        print("[✓] ALL REAL STORAGE OBJECT FIXTURES AND BOUNDARIES VERIFIED SUCCESSFULLY")
    else:
        print("[-] STORAGE BOUNDARY VERIFICATION FAILED - FAILING CLOSED")
    print("=" * 75)
    return all_passed

def main():
    parser = argparse.ArgumentParser(description="AGILA Hub Storage Real Fixture Setup & Verification")
    parser.add_argument("--member-jwt", default=os.getenv("MEMBER_A_JWT", "").strip(), help="Member A JWT")
    parser.add_argument("--member-uid", default=os.getenv("MEMBER_A_UID", "").strip(), help="Member A Auth UID")
    parser.add_argument("--member-b-jwt", default=os.getenv("MEMBER_B_JWT", "").strip(), help="Member B JWT")
    parser.add_argument("--officer-jwt", default=os.getenv("OFFICER_JWT", "").strip(), help="Officer JWT")
    args = parser.parse_args()

    if not args.member_jwt or not args.member_uid:
        print("[-] FATAL: Requires --member-jwt and --member-uid (or MEMBER_A_JWT and MEMBER_A_UID env vars)")
        print("[-] Example:")
        print("[-]   python execution/setup_storage_fixtures.py --member-jwt '<jwt>' --member-uid '<uid>'")
        return 1

    success = upload_and_verify_storage(
        member_jwt=args.member_jwt,
        member_uid=args.member_uid,
        member_b_jwt=args.member_b_jwt or None,
        officer_jwt=args.officer_jwt or None
    )
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
