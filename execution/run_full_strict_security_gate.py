#!/usr/bin/env python3
"""
AGILA Hub - Full Strict Security Gate Execution & Orchestration
Performs complete autonomous execution of the hardened security gate:
1. Authenticates all 5 test personas against Supabase Auth:
   - Member A (Active): member.a@eagles.internal
   - Member B (Cross-Chapter): member.b@eagles.internal
   - Officer: officer@eagles.internal
   - Administrator: admin@eagles.internal
   - Suspended Member: suspended@eagles.internal
2. Provisions and verifies real binary storage fixtures (setup_storage_fixtures.py).
3. Executes the 100% strict multi-role authorization suite (test_api_role_authorization.py).
4. Executes the verified security remediation runner with pre/post-fetch fixture immutability.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import subprocess

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "jgpigkeekfuawbyilycq")
DEFAULT_SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", DEFAULT_SUPABASE_URL)
ANON_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"
)

TEST_PASSWORD = os.getenv("AGILA_TEST_PASSWORD", "AgilaTestPassword2026!")

PERSONAS = {
    "MEMBER_A": {"email": "member.a@eagles.internal", "role": "member", "label": "Member A (Active)"},
    "MEMBER_B": {"email": "member.b@eagles.internal", "role": "member", "label": "Member B (Cross-Chapter)"},
    "OFFICER":  {"email": "officer@eagles.internal",  "role": "officer", "label": "Officer"},
    "ADMIN":    {"email": "admin@eagles.internal",    "role": "admin", "label": "Administrator"},
    "SUSPENDED":{"email": "suspended@eagles.internal","role": "suspended", "label": "Suspended Member"},
}

def login_user(email: str, password: str) -> tuple:
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    }
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, data.get("access_token"), data.get("user", {}).get("id")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="ignore")
        return False, None, f"HTTP {e.code}: {err}"
    except Exception as e:
        return False, None, str(e)

def main():
    print("=" * 80)
    print("AGILA HUB: AUTONOMOUS STRICT SECURITY GATE ORCHESTRATOR")
    print(f"Target Supabase API: {SUPABASE_URL}")
    print("=" * 80)

    tokens = {}
    uids = {}
    missing_accounts = []

    print("\n--- 1. Authenticating All 5 Strict Role Personas ---")
    for key, info in PERSONAS.items():
        email = info["email"]
        success, token, uid_or_err = login_user(email, TEST_PASSWORD)
        if success:
            tokens[f"{key}_JWT"] = token
            uids[f"{key}_UID"] = uid_or_err
            print(f"[PASS] {info['label']} ({email}) -> Authenticated (UID: {uid_or_err[:8]}...)")
        else:
            missing_accounts.append((info["label"], email, uid_or_err))
            print(f"[FAIL] {info['label']} ({email}) -> Login failed: {uid_or_err}")

    if missing_accounts:
        print("\n" + "!" * 80)
        print("ACTION REQUIRED: Test accounts not yet seeded or passwords mismatch in auth.users.")
        print("To provision these 5 accounts instantly:")
        print("  1. Open Supabase Dashboard -> SQL Editor")
        print("  2. Run the script:")
        print("     execution/seed_test_auth_personas.sql")
        print("  3. Rerun:")
        print("     python execution/run_full_strict_security_gate.py")
        print("!" * 80)
        return 1

    # Inject into environment for child scripts
    env = os.environ.copy()
    for k, v in tokens.items():
        env[k] = v
    for k, v in uids.items():
        env[k] = v

    # -------------------------------------------------------------------------
    # 2. Setup Real Binary Storage Fixtures
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- 2. Setting Up & Verifying Real Storage Binary Fixtures ---")
    storage_cmd = [
        sys.executable,
        "execution/setup_storage_fixtures.py",
        "--member-jwt", tokens["MEMBER_A_JWT"],
        "--member-uid", uids["MEMBER_A_UID"],
        "--member-b-jwt", tokens["MEMBER_B_JWT"],
        "--officer-jwt", tokens["OFFICER_JWT"],
    ]
    res_storage = subprocess.run(storage_cmd, env=env)
    if res_storage.returncode != 0:
        print("[-] FATAL: Storage fixture setup and verification failed.")
        return 1

    # -------------------------------------------------------------------------
    # 3. Execute Strict Multi-Role Authorization Suite
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- 3. Executing Strict Multi-Role Authorization Matrix Suite ---")
    role_cmd = [sys.executable, "tests/test_api_role_authorization.py"]
    res_role = subprocess.run(role_cmd, env=env)
    if res_role.returncode != 0:
        print("[-] FATAL: Strict multi-role authorization suite failed.")
        return 1

    # -------------------------------------------------------------------------
    # 4. Execute Post-Remediation Hardened Verification Runner
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- 4. Executing Hardened Security Remediation Verification Runner ---")
    rem_cmd = [
        sys.executable,
        "execution/apply_security_remediation.py",
        "--verify-only",
        "--auth-token", tokens["ADMIN_JWT"]
    ]
    res_rem = subprocess.run(rem_cmd, env=env)
    if res_rem.returncode != 0:
        print("[-] FATAL: Remediation runner verification failed.")
        return 1

    # -------------------------------------------------------------------------
    # 5. Capture Independent Live Security Posture & Database Evidence
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- 5. Capturing Independent Live Security Posture & Database Evidence ---")
    audit_cmd = [sys.executable, "execution/audit_database_security_posture.py"]
    res_audit = subprocess.run(audit_cmd, env=env)
    if res_audit.returncode != 0:
        print("[-] FATAL: Database posture and evidence audit failed.")
        return 1

    print("\n" + "=" * 80)
    print("[✓] ALL STRICT PRODUCTION SECURITY GATE CHECKS VERIFIED & PASSED (100%)")
    print("=" * 80)
    return 0

if __name__ == "__main__":
    sys.exit(main())
