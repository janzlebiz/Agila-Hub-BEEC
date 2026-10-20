#!/usr/bin/env python3
"""
AGILA Hub - Full Strict Security Gate Execution & Orchestration
Performs complete autonomous execution of the hardened security gate:
1. Validates checked-out Git commit SHA (rejects UNKNOWN or mismatches).
2. Authenticates all 5 test personas against Supabase Auth:
   - Member A (Active): member.a@eagles.internal
   - Member B (Cross-Chapter): member.b@eagles.internal
   - Officer: officer@eagles.internal
   - Administrator: admin@eagles.internal
   - Suspended Member: suspended@eagles.internal
3. Provisions and verifies real binary storage fixtures (setup_storage_fixtures.py).
4. Executes the 100% strict multi-role authorization suite (test_api_role_authorization.py).
5. Executes the verified security remediation runner (apply_security_remediation.py --verify-only).
6. Captures independent live database catalog and security posture evidence (audit_database_security_posture.py).
7. Validates that live_security_posture_evidence.json is fresh, commit hashes match, catalog checks are present, and all assertions pass.
8. Saves timestamped raw test output alongside the evidence JSON.
"""

import os
import sys
import json
import subprocess
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

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
    run_start_utc = datetime.now(timezone.utc)
    timestamp_str = run_start_utc.strftime("%Y%m%d_%H%M%S")
    
    evidence_dir = Path(__file__).parent / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)
    raw_log_path = evidence_dir / f"security_gate_run_{timestamp_str}.log"
    latest_log_path = evidence_dir / "latest_raw_test_output.log"

    def log(msg: str = ""):
        print(msg, flush=True)
        ts = datetime.now(timezone.utc).isoformat()
        with open(raw_log_path, "a", encoding="utf-8") as f_raw, open(latest_log_path, "a", encoding="utf-8") as f_latest:
            if msg:
                line = f"[{ts}] {msg}\n"
            else:
                line = "\n"
            f_raw.write(line)
            f_latest.write(line)

    # Initialize log files
    with open(raw_log_path, "w", encoding="utf-8") as f_raw, open(latest_log_path, "w", encoding="utf-8") as f_latest:
        header = f"=== AGILA HUB STRICT SECURITY GATE RUN: {run_start_utc.isoformat()} ===\n"
        f_raw.write(header)
        f_latest.write(header)

    log("=" * 80)
    log("AGILA HUB: AUTONOMOUS STRICT SECURITY GATE ORCHESTRATOR")
    log(f"Target Supabase API: {SUPABASE_URL}")
    log(f"Run Started UTC:    {run_start_utc.isoformat()}")
    log("=" * 80)

    # 1. Capture and Validate Git Commit SHA
    try:
        checked_out_sha = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    except Exception as e:
        checked_out_sha = "UNKNOWN"

    log(f"[i] Checked-Out Git Commit SHA: {checked_out_sha}")
    if checked_out_sha == "UNKNOWN" or len(checked_out_sha) != 40 or not all(c in "0123456789abcdefABCDEF" for c in checked_out_sha):
        log(f"[-] FATAL: Invalid Git commit SHA '{checked_out_sha}'. Rejection requirement enforced: UNKNOWN or invalid SHAs are prohibited.")
        return 1

    tokens = {}
    uids = {}
    missing_accounts = []

    log("\n--- 1. Authenticating All 5 Strict Role Personas ---")
    for key, info in PERSONAS.items():
        email = info["email"]
        success, token, uid_or_err = login_user(email, TEST_PASSWORD)
        if success:
            tokens[f"{key}_JWT"] = token
            uids[f"{key}_UID"] = uid_or_err
            log(f"[PASS] {info['label']} ({email}) -> Authenticated (UID: {uid_or_err[:8]}...)")
        else:
            missing_accounts.append((info["label"], email, uid_or_err))
            log(f"[FAIL] {info['label']} ({email}) -> Login failed: {uid_or_err}")

    if missing_accounts:
        log("\n" + "!" * 80)
        log("ACTION REQUIRED: Test accounts not yet seeded or passwords mismatch in auth.users.")
        log("To provision these 5 accounts instantly:")
        log("  1. Open Supabase Dashboard -> SQL Editor")
        log("  2. Run the script: execution/seed_test_auth_personas.sql")
        log("  3. Rerun: python execution/run_full_strict_security_gate.py")
        log("!" * 80)
        return 1

    # Inject into environment for child scripts
    env = os.environ.copy()
    for k, v in tokens.items():
        env[k] = v
    for k, v in uids.items():
        env[k] = v

    def run_subagent_task(step_num: int, title: str, cmd: list) -> bool:
        log("\n" + "=" * 80)
        log(f"--- {step_num}. {title} ---")
        log(f"[+] Command: {' '.join(cmd)}")
        log("=" * 80)
        proc = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=(sys.platform == "win32")
        )
        for line in proc.stdout:
            log(line.rstrip())
        proc.wait()
        if proc.returncode != 0:
            log(f"[-] FATAL: Step {step_num} ({title}) failed with exit code {proc.returncode}.")
            return False
        log(f"[✓] Step {step_num} ({title}) passed successfully.")
        return True

    # -------------------------------------------------------------------------
    # 2. Setup Real Binary Storage Fixtures
    # -------------------------------------------------------------------------
    storage_cmd = [
        sys.executable,
        "execution/setup_storage_fixtures.py",
        "--member-jwt", tokens["MEMBER_A_JWT"],
        "--member-uid", uids["MEMBER_A_UID"],
        "--member-b-jwt", tokens["MEMBER_B_JWT"],
        "--officer-jwt", tokens["OFFICER_JWT"],
    ]
    if not run_subagent_task(2, "Setting Up & Verifying Real Storage Binary Fixtures", storage_cmd):
        return 1

    # -------------------------------------------------------------------------
    # 3. Execute Strict Multi-Role Authorization Suite
    # -------------------------------------------------------------------------
    role_cmd = [sys.executable, "tests/test_api_role_authorization.py"]
    if not run_subagent_task(3, "Executing Strict Multi-Role Authorization Matrix Suite", role_cmd):
        return 1

    # -------------------------------------------------------------------------
    # 4. Execute Post-Remediation Hardened Verification Runner
    # -------------------------------------------------------------------------
    rem_cmd = [
        sys.executable,
        "execution/apply_security_remediation.py",
        "--verify-only",
        "--auth-token", tokens["ADMIN_JWT"]
    ]
    if not run_subagent_task(4, "Executing Hardened Security Remediation Verification Runner", rem_cmd):
        return 1

    # -------------------------------------------------------------------------
    # 5. Capture Independent Live Security Posture & Database Catalog Evidence
    # -------------------------------------------------------------------------
    audit_cmd = [sys.executable, "execution/audit_database_security_posture.py"]
    if not run_subagent_task(5, "Capturing Independent Live Security Posture & Database Catalog Evidence", audit_cmd):
        return 1

    # -------------------------------------------------------------------------
    # 6. Post-Run Strict Evidence Validation & Gate Posture Verification
    # -------------------------------------------------------------------------
    log("\n" + "=" * 80)
    log("--- 6. Post-Run Strict Security Gate Evidence Verification ---")
    log("=" * 80)

    evidence_file = evidence_dir / "live_security_posture_evidence.json"
    if not evidence_file.exists():
        log(f"[-] FATAL: Evidence JSON file does not exist: {evidence_file}")
        return 1

    mtime = datetime.fromtimestamp(evidence_file.stat().st_mtime, tz=timezone.utc)
    if mtime < run_start_utc:
        log(f"[-] FATAL: Evidence JSON is STALE! File modified at {mtime.isoformat()} prior to run start {run_start_utc.isoformat()}.")
        return 1
    log(f"[PASS] Evidence Timestamp Verified Fresh: {mtime.isoformat()} (Run started {run_start_utc.isoformat()})")

    try:
        with open(evidence_file, "r", encoding="utf-8") as f:
            evidence_data = json.load(f)
    except Exception as e:
        log(f"[-] FATAL: Failed to parse evidence JSON: {e}")
        return 1

    # Verify Commit SHA Agreement
    recorded_sha = evidence_data.get("metadata", {}).get("git_commit_sha")
    log(f"[i] Evidence Recorded Commit SHA: {recorded_sha}")
    log(f"[i] Checked-Out HEAD Commit SHA:  {checked_out_sha}")

    if not recorded_sha or recorded_sha == "UNKNOWN" or recorded_sha != checked_out_sha:
        log(f"[-] FATAL: Commit SHA disagreement! Recorded '{recorded_sha}' != Checked-out '{checked_out_sha}'. Rejection rule enforced.")
        return 1
    log("[PASS] Commit SHA Match Verified: 100% agreement between working tree and recorded evidence.")

    # Verify Overall Verdict
    if evidence_data.get("verdict") != "PASSED":
        log(f"[-] FATAL: Overall evidence verdict is '{evidence_data.get('verdict')}'. Must be 'PASSED'.")
        return 1
    log("[PASS] Overall Evidence Verdict: PASSED")

    # Verify Required Catalog Checks are Present and Populated
    cat_ver = evidence_data.get("catalog_verification", {})
    if not cat_ver.get("verified"):
        log(f"[-] FATAL: Database catalog verification failed or missing! Details: {cat_ver}")
        return 1
    log("[PASS] Database Catalog Verification: VERIFIED (Live pg_proc, pg_policies, schema privileges, and schema_migrations)")

    secdef_funcs = evidence_data.get("security_definer_functions", {})
    if not secdef_funcs or len(secdef_funcs) == 0:
        log("[-] FATAL: No SECURITY DEFINER functions recorded in catalog evidence.")
        return 1
    log(f"[PASS] SECURITY DEFINER Catalog Audit: {len(secdef_funcs)} functions cataloged and hardened.")

    rls_tables = evidence_data.get("rls_table_protections", {})
    if not rls_tables or len(rls_tables) < 8:
        log(f"[-] FATAL: Incomplete RLS table coverage in catalog evidence ({len(rls_tables)}/8 core tables).")
        return 1
    log(f"[PASS] RLS Table Coverage: {len(rls_tables)} core domain tables protected under pg_policies.")

    cat_migs = evidence_data.get("catalog_migrations", [])
    if not cat_migs or len(cat_migs) < 10:
        log(f"[-] FATAL: Incomplete migrations in remote catalog ({len(cat_migs)}/10 applied).")
        return 1
    log(f"[PASS] Remote Catalog Migrations: {len(cat_migs)} migrations confirmed applied in supabase_migrations.")

    log("\n" + "=" * 80)
    log("[✓] ALL STRICT PRODUCTION SECURITY GATE CHECKS VERIFIED & PASSED (100%)")
    log(f"[✓] Evidence JSON: {evidence_file}")
    log(f"[✓] Raw Run Log:   {raw_log_path}")
    log("=" * 80)
    return 0

if __name__ == "__main__":
    sys.exit(main())
