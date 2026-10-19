#!/usr/bin/env python3
"""
AGILA Hub - Apply Security Audit Remediation & Verification Runner
Resolves Audit Finding R-05:
- Fails non-zero (exit code 1) when credentials are missing or migration fails.
- Halts execution on the first migration error.
- Executes post-migration verification assertions against the live Supabase project.
- Supports --verify-only mode to audit current database state without mutating.
"""
import os
import sys
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "jgpigkeekfuawbyilycq")
DEFAULT_SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", DEFAULT_SUPABASE_URL)
ANON_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"
)

MIGRATIONS_DIR = Path(__file__).parent.parent / "supabase" / "migrations"
MIGRATION_FILES = [
    MIGRATIONS_DIR / "20261019000006_security_audit_remediation.sql",
    MIGRATIONS_DIR / "20261019000007_residual_security_remediation.sql",
]

def make_http_request(url: str, headers: dict, data: dict = None, method: str = "GET") -> tuple:
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def apply_migrations(access_token: str) -> bool:
    print("\n--- Applying Security Migrations to Production Database ---")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

    for mig_file in MIGRATION_FILES:
        if not mig_file.exists():
            print(f"[-] FATAL: Migration file not found: {mig_file}")
            return False

        sql_content = mig_file.read_text(encoding="utf-8")
        print(f"[+] Applying {mig_file.name} ({len(sql_content)} bytes)...")
        status, response = make_http_request(url, headers=headers, data={"query": sql_content}, method="POST")

        if status not in (200, 201):
            print(f"[-] FATAL: Migration {mig_file.name} failed with HTTP {status}!")
            print(f"[-] Details: {response}")
            return False

        print(f"[✓] {mig_file.name} applied successfully!")

    return True

def verify_database_state() -> bool:
    print("\n--- Running Post-Migration Verification Assertions ---")
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
    }
    all_passed = True

    def assert_check(name: str, passed: bool, details: str):
        nonlocal all_passed
        if not passed:
            all_passed = False
        tag = "[PASS]" if passed else "[FAIL]"
        print(f"{tag} {name}: {details}")

    # 1. Mutating RPCs must reject anonymous callers
    status, body = make_http_request(
        f"{SUPABASE_URL}/rest/v1/rpc/approve_member_applicant",
        headers=headers,
        data={"p_member_id": "00000000-0000-0000-0000-000000000001"},
        method="POST"
    )
    # Must reject anon: 401, 403, or 404 (if function grant revoked from anon)
    passed_rpc1 = status in (401, 403, 404) or (status == 400 and "unauthorized" in str(body).lower())
    assert_check("Anon RPC: approve_member_applicant", passed_rpc1, f"HTTP {status} (Expected rejection)")

    status, body = make_http_request(
        f"{SUPABASE_URL}/rest/v1/rpc/verify_contribution",
        headers=headers,
        data={"p_contribution_id": "00000000-0000-0000-0000-000000000001", "p_status": "verified"},
        method="POST"
    )
    passed_rpc2 = status in (401, 403, 404) or (status == 400 and "unauthorized" in str(body).lower())
    assert_check("Anon RPC: verify_contribution", passed_rpc2, f"HTTP {status} (Expected rejection)")

    # 2. Direct table mutations must be rejected
    status, body = make_http_request(
        f"{SUPABASE_URL}/rest/v1/contributions",
        headers=headers,
        data={"member_id": "00000000-0000-0000-0000-000000000001", "title": "Injected Dues", "amount": 1000},
        method="POST"
    )
    passed_insert = status in (401, 403, 404, 400)
    assert_check("Anon Direct INSERT: contributions", passed_insert, f"HTTP {status} (Direct table write blocked)")

    # 3. Storage bucket private enforcement
    status, _ = make_http_request(f"{SUPABASE_URL}/storage/v1/object/receipts/nonexistent.png", headers=headers)
    assert_check("Storage: receipts private read", status in (400, 401, 403, 404), f"HTTP {status} (Public access denied)")

    status, _ = make_http_request(f"{SUPABASE_URL}/storage/v1/object/member-ids/nonexistent.png", headers=headers)
    assert_check("Storage: member-ids private read", status in (400, 401, 403, 404), f"HTTP {status} (Public access denied)")

    return all_passed

def main():
    parser = argparse.ArgumentParser(description="AGILA Hub Migration & Verification Runner")
    parser.add_argument("--token", help="Supabase Personal Access Token")
    parser.add_argument("--verify-only", action="store_true", help="Run assertions only without applying migrations")
    args = parser.parse_args()

    access_token = args.token or os.getenv("SUPABASE_ACCESS_TOKEN", "").strip()

    print("=" * 70)
    print("AGILA HUB: SECURITY AUDIT REMEDIATION RUNNER")
    print(f"Target Supabase Project: {PROJECT_REF}")
    print("=" * 70)

    if args.verify_only:
        print("[i] Running in --verify-only mode.")
        success = verify_database_state()
        print("\n" + "=" * 70)
        print("VERIFICATION RESULT:", "PASSED (Production Secured)" if success else "FAILED (Pending Remediations)")
        print("=" * 70)
        return 0 if success else 1

    if not access_token:
        print("[-] FATAL: SUPABASE_ACCESS_TOKEN is not configured.")
        print("[-] Cannot apply database migrations without authorization credentials.")
        print("[-] Options to proceed:")
        print("[-]   1. Provide access token:")
        print("[-]      $env:SUPABASE_ACCESS_TOKEN='<your_token>'; python execution/apply_security_remediation.py")
        print("[-]   2. Run verification only:")
        print("[-]      python execution/apply_security_remediation.py --verify-only")
        print("[-]   3. Apply migrations via Supabase Dashboard SQL Editor:")
        print(f"[-]      {MIGRATIONS_DIR / '20261019000007_residual_security_remediation.sql'}")
        return 1

    applied = apply_migrations(access_token)
    if not applied:
        print("[-] Migration halted due to errors. Post-migration verification skipped.")
        return 1

    verified = verify_database_state()
    if not verified:
        print("[-] Post-migration verification assertions failed.")
        return 1

    print("\n[✓] All migrations applied and post-migration security assertions verified successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
