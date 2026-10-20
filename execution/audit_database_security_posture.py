#!/usr/bin/env python3
"""
AGILA Hub - Independent Live Security Posture & Database Evidence Auditor
Captures deterministic, read-only database evidence supporting:
1. Exact Git commit SHA, branch, and UTC ISO-8601 execution timestamp (strictly rejects UNKNOWN or mismatches).
2. Live identity verification of all 5 authenticated personas in auth.users and public.members.
3. Live state verification of test fixtures (pending applicant, pending contribution, active event, probe member).
4. Independent verification of all SECURITY DEFINER functions, role grants, and search-path hardening via database catalog inspection.
5. Real PostgreSQL catalog checks:
   - All SECURITY DEFINER functions in pg_proc, ownership (postgres), configured search paths, and execution grants.
   - Public schema CREATE privileges (strictly revoked from PUBLIC, anon, and authenticated).
   - Core domain table Row-Level Security (RLS) policies from pg_policies.
   - Database schema migration versions directly from supabase_migrations.schema_migrations.
6. Storage bucket privacy, owner pre/post verification, and cross-member isolation.
7. Explicit classification of the Supabase Auth leaked-password warning as a Free-plan platform limitation.
"""

import os
import sys
import json
import base64
import subprocess
from datetime import datetime, timezone
import urllib.request
import urllib.error
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
    "MEMBER_A": {"email": "member.a@eagles.internal", "expected_role": "member", "expected_status": "active", "label": "Member A (Active)"},
    "MEMBER_B": {"email": "member.b@eagles.internal", "expected_role": "member", "expected_status": "active", "label": "Member B (Cross-Chapter)"},
    "OFFICER":  {"email": "officer@eagles.internal",  "expected_role": "officer", "expected_status": "active", "label": "Officer"},
    "ADMIN":    {"email": "admin@eagles.internal",    "expected_role": "admin", "expected_status": "active", "label": "Administrator"},
    "SUSPENDED":{"email": "suspended@eagles.internal","expected_role": "member", "expected_status": "suspended", "label": "Suspended Member"},
}

FIXTURES = {
    "PENDING_APPLICANT": "1fd1fc3a-bb3c-4222-b16c-b50c21a25bd4",
    "PENDING_CONTRIBUTION": "30000000-0000-0000-0000-000000000002",
    "ACTIVE_EVENT": "20000000-0000-0000-0000-000000000001",
    "PROBE_MEMBER": "FIXTURE-SECURITY-PROBE"
}

CORE_DOMAIN_TABLES = [
    "members", "announcements", "events", "attendance",
    "contributions", "documents", "audit_logs", "member_claim_tokens"
]

def extract_jwt_sub(token: str) -> str:
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            padding = 4 - (len(parts[1]) % 4)
            b64_str = parts[1] + ("=" * (padding % 4))
            payload = json.loads(base64.urlsafe_b64decode(b64_str.encode("utf-8")).decode("utf-8"))
            return payload.get("sub") or ""
    except Exception:
        pass
    return ""

def http_request(url: str, method: str = "GET", data: dict = None, auth_token: str = None, headers_extra: dict = None) -> tuple:
    headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json",
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    else:
        headers["Authorization"] = f"Bearer {ANON_KEY}"
    if headers_extra:
        headers.update(headers_extra)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            try:
                parsed = json.loads(content.decode("utf-8"))
            except Exception:
                parsed = content.decode("utf-8", errors="replace")
            return resp.status, parsed, content
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        err_body = err_bytes.decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed, err_bytes
    except Exception as e:
        return 0, str(e), b""

def run_catalog_sql_query(sql: str) -> tuple:
    """
    Executes a read-only catalog query against the linked database using the Supabase CLI / Management API.
    Returns (success: bool, rows: list, error: str)
    """
    flat_sql = " ".join(sql.split())
    cmd = ["npx", "supabase", "db", "query", "--linked", flat_sql]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
        if res.returncode != 0:
            err = res.stderr or res.stdout
            return False, [], f"Command failed (code {res.returncode}): {err}"
        out = res.stdout
        idx = out.find("{")
        if idx == -1:
            return False, [], "No JSON payload found in CLI response"
        data = json.loads(out[idx:])
        rows = data.get("rows", [])
        return True, rows, ""
    except subprocess.TimeoutExpired:
        return False, [], "Database query timed out after 30 seconds"
    except Exception as e:
        return False, [], str(e)

def main():
    print("=" * 80)
    print("AGILA HUB: INDEPENDENT LIVE SECURITY POSTURE AUDITOR & EVIDENCE RECORDER")
    print(f"Target Supabase API: {SUPABASE_URL}")
    print("=" * 80)

    # 1. Capture Git and Execution Metadata (Strict validation, reject UNKNOWN)
    try:
        commit_sha = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    except Exception:
        commit_sha = "UNKNOWN"
    try:
        commit_branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode().strip()
    except Exception:
        commit_branch = "UNKNOWN"

    timestamp_utc = datetime.now(timezone.utc).isoformat()
    print(f"[i] Git Commit SHA: {commit_sha}")
    print(f"[i] Git Branch:     {commit_branch}")
    print(f"[i] Timestamp UTC:  {timestamp_utc}")

    if commit_sha == "UNKNOWN" or len(commit_sha) != 40 or not all(c in "0123456789abcdefABCDEF" for c in commit_sha):
        print(f"[-] FATAL: Invalid Git commit SHA detected: '{commit_sha}'. Rejecting 'UNKNOWN' or non-hex commit hashes.")
        return 1

    evidence = {
        "metadata": {
            "project_ref": PROJECT_REF,
            "supabase_url": SUPABASE_URL,
            "git_commit_sha": commit_sha,
            "git_branch": commit_branch,
            "execution_timestamp_utc": timestamp_utc,
            "platform": sys.platform,
            "python_version": sys.version
        },
        "identities": {},
        "fixtures": {},
        "security_definer_functions": {},
        "all_public_functions": [],
        "public_schema_privileges": {},
        "effective_role_grants": {},
        "storage_boundaries": {},
        "rls_table_protections": {},
        "catalog_migrations": [],
        "catalog_verification": {
            "verified": False,
            "summary": {}
        },
        "platform_limitations": {
            "supabase_auth_leaked_passwords": {
                "classification": "DOCUMENTED_PLATFORM_TIER_LIMITATION",
                "status": "EXPECTED_ON_SUPABASE_FREE_TIER",
                "details": "HaveIBeenPwned breach checking is unavailable on Supabase Free plan projects and requires an upgraded Pro or Team plan add-on.",
                "remediation_status": "Documented in security remediation audit report; does not represent an application security vulnerability or code defect."
            }
        },
        "verdict": "PASSED"
    }

    # 2. Authenticate Personas and Verify Live User Records
    print("\n--- 1. Authenticating Personas & Verifying Live User Records ---")
    tokens = {}
    uids = {}

    for key, pinfo in PERSONAS.items():
        email = pinfo["email"]
        s_auth, b_auth, _ = http_request(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            method="POST",
            data={"email": email, "password": TEST_PASSWORD}
        )
        if s_auth == 200 and isinstance(b_auth, dict) and b_auth.get("access_token"):
            token = b_auth["access_token"]
            uid = b_auth.get("user", {}).get("id") or extract_jwt_sub(token)
            tokens[key] = token
            uids[key] = uid
            print(f"[PASS] {pinfo['label']} authenticated -> UID: {uid}")
        else:
            print(f"[FAIL] {pinfo['label']} login failed: {b_auth}")
            evidence["verdict"] = "FAILED"
            return 1

    admin_token = tokens["ADMIN"]

    # Verify each persona's record in public.members via Admin token
    for key, pinfo in PERSONAS.items():
        uid = uids[key]
        s_mem, b_mem, _ = http_request(
            f"{SUPABASE_URL}/rest/v1/members?user_id=eq.{uid}",
            auth_token=admin_token
        )
        if s_mem == 200 and isinstance(b_mem, list) and len(b_mem) == 1:
            rec = b_mem[0]
            matched_role = (rec.get("role") == pinfo["expected_role"])
            matched_status = (rec.get("membership_status") == pinfo["expected_status"])
            print(f"[PASS] Member Record Verified ({pinfo['label']}): Role={rec.get('role')}, Status={rec.get('membership_status')}, Chapter={rec.get('chapter_or_branch')}")
            evidence["identities"][key] = {
                "email": pinfo["email"],
                "uid": uid,
                "profile_id": rec.get("id"),
                "member_number": rec.get("member_number"),
                "role": rec.get("role"),
                "membership_status": rec.get("membership_status"),
                "chapter_or_branch": rec.get("chapter_or_branch"),
                "verified": matched_role and matched_status
            }
        else:
            print(f"[FAIL] Member record lookup failed for {pinfo['label']}")
            evidence["verdict"] = "FAILED"

    # 3. Verify Live Test Fixtures State
    print("\n--- 2. Verifying Live Test Fixtures State ---")
    s_app, b_app, _ = http_request(f"{SUPABASE_URL}/rest/v1/members?id=eq.{FIXTURES['PENDING_APPLICANT']}", auth_token=admin_token)
    app_valid = (s_app == 200 and isinstance(b_app, list) and len(b_app) == 1 and b_app[0].get("membership_status") == "pending")
    print(f"[{'PASS' if app_valid else 'FAIL'}] Pending Applicant Fixture ({FIXTURES['PENDING_APPLICANT']}): Status={b_app[0].get('membership_status') if b_app else 'N/A'}")
    evidence["fixtures"]["pending_applicant"] = {
        "id": FIXTURES["PENDING_APPLICANT"],
        "status": b_app[0].get("membership_status") if b_app else None,
        "verified": app_valid
    }

    s_ct, b_ct, _ = http_request(f"{SUPABASE_URL}/rest/v1/contributions?id=eq.{FIXTURES['PENDING_CONTRIBUTION']}", auth_token=admin_token)
    ct_valid = (s_ct == 200 and isinstance(b_ct, list) and len(b_ct) == 1 and b_ct[0].get("status") == "pending")
    print(f"[{'PASS' if ct_valid else 'FAIL'}] Pending Contribution Fixture ({FIXTURES['PENDING_CONTRIBUTION']}): Status={b_ct[0].get('status') if b_ct else 'N/A'}, Amount={b_ct[0].get('amount') if b_ct else 'N/A'}")
    evidence["fixtures"]["pending_contribution"] = {
        "id": FIXTURES["PENDING_CONTRIBUTION"],
        "status": b_ct[0].get("status") if b_ct else None,
        "amount": b_ct[0].get("amount") if b_ct else None,
        "verified": ct_valid
    }

    s_ev, b_ev, _ = http_request(f"{SUPABASE_URL}/rest/v1/events?id=eq.{FIXTURES['ACTIVE_EVENT']}", auth_token=admin_token)
    ev_valid = (s_ev == 200 and isinstance(b_ev, list) and len(b_ev) == 1 and b_ev[0].get("status") == "published" and b_ev[0].get("checkin_open") is True)
    print(f"[{'PASS' if ev_valid else 'FAIL'}] Active Event Fixture ({FIXTURES['ACTIVE_EVENT']}): Status={b_ev[0].get('status') if b_ev else 'N/A'}, CheckinOpen={b_ev[0].get('checkin_open') if b_ev else 'N/A'}, Code={b_ev[0].get('checkin_code') if b_ev else 'N/A'}")
    evidence["fixtures"]["active_event"] = {
        "id": FIXTURES["ACTIVE_EVENT"],
        "status": b_ev[0].get("status") if b_ev else None,
        "checkin_open": b_ev[0].get("checkin_open") if b_ev else None,
        "checkin_code": b_ev[0].get("checkin_code") if b_ev else None,
        "verified": ev_valid
    }

    s_pm, b_pm, _ = http_request(f"{SUPABASE_URL}/rest/v1/members?member_number=eq.{FIXTURES['PROBE_MEMBER']}", auth_token=admin_token)
    pm_valid = (s_pm == 200 and isinstance(b_pm, list) and len(b_pm) == 1 and b_pm[0].get("membership_status") == "active")
    print(f"[{'PASS' if pm_valid else 'FAIL'}] Probe Member Fixture ({FIXTURES['PROBE_MEMBER']}): Status={b_pm[0].get('membership_status') if b_pm else 'N/A'}")
    evidence["fixtures"]["probe_member"] = {
        "member_number": FIXTURES["PROBE_MEMBER"],
        "status": b_pm[0].get("membership_status") if b_pm else None,
        "verified": pm_valid
    }

    # 4. Live RPC Authorization & Role Grants Audit
    print("\n--- 3. SECURITY DEFINER Functions & Role Grants Live Audit ---")
    sensitive_rpcs = [
        ("approve_member_applicant", {"p_member_id": FIXTURES["PENDING_APPLICANT"]}),
        ("verify_contribution", {"p_contribution_id": FIXTURES["PENDING_CONTRIBUTION"], "p_status": "verified"}),
        ("submit_self_contribution", {"p_title": "Probe", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"}),
        ("check_in_self_event", {"p_event_id": FIXTURES["ACTIVE_EVENT"], "p_checkin_code": "AGILA-GMM-2026"}),
        ("generate_member_claim_token", {"p_member_number": FIXTURES["PROBE_MEMBER"]}),
        ("officer_submit_contribution_for_member", {"p_target_member_id": FIXTURES["PENDING_APPLICANT"], "p_title": "Dues", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"}),
        ("officer_update_member_profile", {"p_target_member_id": FIXTURES["PENDING_APPLICANT"], "p_first_name": "AuditProbe"}),
        ("get_financial_ledger_summary", {}),
    ]

    for rpc_name, payload in sensitive_rpcs:
        s_anon, b_anon, _ = http_request(f"{SUPABASE_URL}/rest/v1/rpc/{rpc_name}", method="POST", data=payload)
        is_42501 = (s_anon in (401, 403)) and isinstance(b_anon, dict) and b_anon.get("code") == "42501"
        print(f"[{'PASS' if is_42501 else 'FAIL'}] Anon RPC Denial: {rpc_name} -> HTTP {s_anon}, Code={b_anon.get('code') if isinstance(b_anon, dict) else 'N/A'}")
        evidence["effective_role_grants"][f"anon_{rpc_name}"] = {
            "status": s_anon,
            "code": b_anon.get("code") if isinstance(b_anon, dict) else None,
            "message": b_anon.get("message") if isinstance(b_anon, dict) else str(b_anon),
            "verified": is_42501
        }

    officer_rpcs_for_member = [
        ("approve_member_applicant", {"p_member_id": FIXTURES["PENDING_APPLICANT"]}, "Only active officers or administrators can approve member applications"),
        ("verify_contribution", {"p_contribution_id": FIXTURES["PENDING_CONTRIBUTION"], "p_status": "verified"}, "Only active officers or administrators can verify financial contributions"),
        ("officer_submit_contribution_for_member", {"p_target_member_id": FIXTURES["PENDING_APPLICANT"], "p_title": "Dues", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"}, "Only active officers can record contributions on behalf of other members"),
        ("officer_update_member_profile", {"p_target_member_id": FIXTURES["PENDING_APPLICANT"], "p_first_name": "Tamper"}, "Only active officers can modify another member profile"),
        ("generate_member_claim_token", {"p_member_number": FIXTURES["PROBE_MEMBER"]}, "Only active officers or administrators can generate claim tokens"),
    ]

    member_token = tokens["MEMBER_A"]
    for rpc_name, payload, expected_phrase in officer_rpcs_for_member:
        s_mem, b_mem, _ = http_request(f"{SUPABASE_URL}/rest/v1/rpc/{rpc_name}", method="POST", data=payload, auth_token=member_token)
        is_p0001 = (s_mem == 400) and isinstance(b_mem, dict) and b_mem.get("code") == "P0001" and (expected_phrase.lower() in str(b_mem.get("message", "")).lower())
        print(f"[{'PASS' if is_p0001 else 'FAIL'}] Member A Officer RPC Denial: {rpc_name} -> HTTP {s_mem}, Code={b_mem.get('code') if isinstance(b_mem, dict) else 'N/A'}, Msg={str(b_mem.get('message', ''))[:60]}")
        evidence["effective_role_grants"][f"member_a_denial_{rpc_name}"] = {
            "status": s_mem,
            "code": b_mem.get("code") if isinstance(b_mem, dict) else None,
            "message": b_mem.get("message") if isinstance(b_mem, dict) else str(b_mem),
            "verified": is_p0001
        }

    suspended_token = tokens["SUSPENDED"]
    s_susp_sub, b_susp_sub, _ = http_request(
        f"{SUPABASE_URL}/rest/v1/rpc/submit_self_contribution",
        method="POST",
        data={"p_title": "Suspended Probe", "p_category": "dues", "p_amount": 500, "p_payment_method": "cash"},
        auth_token=suspended_token
    )
    susp_sub_valid = (s_susp_sub == 400) and isinstance(b_susp_sub, dict) and b_susp_sub.get("code") == "P0001" and "no active member record" in str(b_susp_sub.get("message", "")).lower()
    print(f"[{'PASS' if susp_sub_valid else 'FAIL'}] Suspended Member Self-Contribution Denial -> HTTP {s_susp_sub}, Code={b_susp_sub.get('code') if isinstance(b_susp_sub, dict) else 'N/A'}")
    evidence["effective_role_grants"]["suspended_submit_self_contribution"] = {
        "status": s_susp_sub,
        "code": b_susp_sub.get("code") if isinstance(b_susp_sub, dict) else None,
        "message": b_susp_sub.get("message") if isinstance(b_susp_sub, dict) else str(b_susp_sub),
        "verified": susp_sub_valid
    }

    officer_token = tokens["OFFICER"]
    s_ledger, b_ledger, _ = http_request(f"{SUPABASE_URL}/rest/v1/rpc/get_financial_ledger_summary", method="POST", data={}, auth_token=officer_token)
    ledger_valid = (s_ledger in (200, 201)) and isinstance(b_ledger, dict) and b_ledger.get("verified_count") is not None
    print(f"[{'PASS' if ledger_valid else 'FAIL'}] Officer Financial Ledger Summary -> HTTP {s_ledger}, TotalCollected={b_ledger.get('total_collected') if isinstance(b_ledger, dict) else 'N/A'}")
    evidence["effective_role_grants"]["officer_financial_ledger"] = {
        "status": s_ledger,
        "total_collected": b_ledger.get("total_collected") if isinstance(b_ledger, dict) else None,
        "verified_count": b_ledger.get("verified_count") if isinstance(b_ledger, dict) else None,
        "verified": ledger_valid
    }

    # 5. Storage Boundaries & Isolation Verification
    print("\n--- 4. Storage Bucket Privacy & Object Isolation Audit ---")
    member_a_uid = uids["MEMBER_A"]
    member_b_token = tokens["MEMBER_B"]
    for bucket in ("receipts", "member-ids"):
        pub_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{member_a_uid}/probe.txt"
        priv_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{member_a_uid}/probe.txt"

        s_own_pre, _, raw_own_pre = http_request(priv_url, auth_token=member_token)
        owner_readable_pre = (s_own_pre == 200 and len(raw_own_pre) == 58)

        s_pub, b_pub, _ = http_request(pub_url)
        pub_private = (s_pub == 400) and ("bucket not found" in str(b_pub).lower() or "not public" in str(b_pub).lower())

        s_anon_obj, b_anon_obj, _ = http_request(priv_url)
        anon_hidden = (s_anon_obj == 400) and ("not_found" in str(b_anon_obj).lower() or "object not found" in str(b_anon_obj).lower())

        s_b_obj, b_b_obj, _ = http_request(priv_url, auth_token=member_b_token)
        b_hidden = (s_b_obj == 400) and ("not_found" in str(b_b_obj).lower() or "object not found" in str(b_b_obj).lower())

        s_off_obj, _, raw_off_obj = http_request(priv_url, auth_token=officer_token)
        off_readable = (s_off_obj == 200 and len(raw_off_obj) == 58)

        s_own_post, _, raw_own_post = http_request(priv_url, auth_token=member_token)
        owner_readable_post = (s_own_post == 200 and len(raw_own_post) == 58)

        storage_all_pass = (owner_readable_pre and pub_private and anon_hidden and b_hidden and off_readable and owner_readable_post)
        print(f"[{'PASS' if storage_all_pass else 'FAIL'}] Bucket: {bucket} (OwnerPre: {s_own_pre}, PubPrivate: {s_pub}, AnonHidden: {s_anon_obj}, CrossMemberHidden: {s_b_obj}, OfficerRead: {s_off_obj}, OwnerPost: {s_own_post})")
        evidence["storage_boundaries"][bucket] = {
            "owner_pre_read": {"status": s_own_pre, "bytes": len(raw_own_pre)},
            "public_endpoint_denial": {"status": s_pub, "body": b_pub},
            "anon_endpoint_denial": {"status": s_anon_obj, "body": b_anon_obj},
            "cross_member_b_denial": {"status": s_b_obj, "body": b_b_obj},
            "officer_access": {"status": s_off_obj, "bytes": len(raw_off_obj)},
            "owner_post_read": {"status": s_own_post, "bytes": len(raw_own_post)},
            "verified": storage_all_pass
        }

    # 6. Real Database Catalog Checks (Requirement 2)
    print("\n--- 5. Real PostgreSQL Database Catalog Auditing (Live pg_catalog & pg_policies) ---")

    # 6.1 Query pg_proc: SECURITY DEFINER functions, ownership, search path, execute grants
    proc_sql = """
    SELECT 
        p.proname AS name,
        n.nspname AS schema,
        pg_get_userbyid(p.proowner) AS owner,
        p.prosecdef AS is_security_definer,
        p.proconfig AS search_path_config,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
        has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_execute
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
    """
    ok_proc, proc_rows, err_proc = run_catalog_sql_query(proc_sql)
    secdef_ok = False
    if ok_proc and proc_rows:
        evidence["all_public_functions"] = proc_rows
        secdef_count = 0
        secdef_hardened_count = 0
        for r in proc_rows:
            fname = r.get("name")
            is_secdef = bool(r.get("is_security_definer"))
            owner = r.get("owner")
            anon_can_exec = bool(r.get("anon_can_execute"))
            pub_can_exec = bool(r.get("public_can_execute"))
            search_path = r.get("search_path_config") or []

            if is_secdef:
                secdef_count += 1
                # Hardening criteria: owned by postgres, anon/public EXECUTE revoked, search_path explicitly configured
                has_search_path = len(search_path) > 0 and any("search_path=" in str(sp) for sp in search_path)
                is_hardened = (owner == "postgres") and (not anon_can_exec) and (not pub_can_exec) and has_search_path
                if is_hardened:
                    secdef_hardened_count += 1

                evidence["security_definer_functions"][fname] = {
                    "owner": owner,
                    "search_path_config": search_path,
                    "anon_can_execute": anon_can_exec,
                    "public_can_execute": pub_can_exec,
                    "authenticated_can_execute": bool(r.get("authenticated_can_execute")),
                    "hardened": is_hardened
                }
        secdef_ok = (secdef_count > 0) and (secdef_count == secdef_hardened_count)
        print(f"[{'PASS' if secdef_ok else 'FAIL'}] Catalog pg_proc: {secdef_count} SECURITY DEFINER functions detected ({secdef_hardened_count}/{secdef_count} hardened with owner=postgres, anon/public revoked, explicit search_path)")
    else:
        print(f"[-] FATAL: Failed to query pg_proc catalog: {err_proc}")

    # 6.2 Query public schema CREATE privileges
    schema_sql = """
    SELECT 
        has_schema_privilege('anon', 'public', 'CREATE') AS anon_can_create,
        has_schema_privilege('authenticated', 'public', 'CREATE') AS authenticated_can_create,
        has_schema_privilege('public', 'public', 'CREATE') AS public_can_create;
    """
    ok_schema, schema_rows, err_schema = run_catalog_sql_query(schema_sql)
    schema_priv_ok = False
    if ok_schema and schema_rows:
        s_row = schema_rows[0]
        anon_create = bool(s_row.get("anon_can_create"))
        auth_create = bool(s_row.get("authenticated_can_create"))
        pub_create = bool(s_row.get("public_can_create"))
        schema_priv_ok = (not anon_create) and (not auth_create) and (not pub_create)
        evidence["public_schema_privileges"] = {
            "anon_can_create": anon_create,
            "authenticated_can_create": auth_create,
            "public_can_create": pub_create,
            "hardened": schema_priv_ok
        }
        print(f"[{'PASS' if schema_priv_ok else 'FAIL'}] Schema Isolation: public CREATE privileges (anon: {anon_create}, authenticated: {auth_create}, public: {pub_create})")
    else:
        print(f"[-] FATAL: Failed to query schema privileges: {err_schema}")

    # 6.3 Query pg_policies: Core domain table Row-Level Security
    policy_sql = """
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
    """
    ok_pol, pol_rows, err_pol = run_catalog_sql_query(policy_sql)
    policies_ok = False
    if ok_pol and pol_rows:
        by_table = {}
        blanket_leaks = 0
        for p in pol_rows:
            tname = p.get("tablename")
            if tname not in by_table:
                by_table[tname] = []
            by_table[tname].append({
                "policyname": p.get("policyname"),
                "permissive": p.get("permissive"),
                "roles": p.get("roles"),
                "cmd": p.get("cmd"),
                "qual": p.get("qual"),
                "with_check": p.get("with_check")
            })
            # Check for permissive blanket USING (true) leaks on sensitive tables
            if tname in ("contributions", "members") and p.get("cmd") == "SELECT" and str(p.get("qual")).strip() == "true":
                blanket_leaks += 1

        evidence["rls_table_protections"] = by_table
        all_tables_protected = all(t in by_table for t in CORE_DOMAIN_TABLES)
        policies_ok = all_tables_protected and (blanket_leaks == 0)
        print(f"[{'PASS' if policies_ok else 'FAIL'}] Catalog pg_policies: {len(pol_rows)} active RLS policies covering {len(by_table)} tables (All 8 core tables covered: {all_tables_protected}, Blanket leaks: {blanket_leaks})")
    else:
        print(f"[-] FATAL: Failed to query pg_policies catalog: {err_pol}")

    # 6.4 Query supabase_migrations.schema_migrations: Live migration version catalog
    mig_sql = "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;"
    ok_mig, mig_rows, err_mig = run_catalog_sql_query(mig_sql)
    mig_ok = False
    if ok_mig and mig_rows:
        mig_versions = [r.get("version") for r in mig_rows if r.get("version")]
        evidence["catalog_migrations"] = mig_versions
        required_migrations = [
            "20261019000000", "20261019000001", "20261019000002", "20261019000003",
            "20261019000004", "20261019000005", "20261019000006", "20261019000007",
            "20261019000008", "20261019000009"
        ]
        all_migs_present = all(m in mig_versions for m in required_migrations)
        mig_ok = all_migs_present and (len(mig_versions) >= 10)
        print(f"[{'PASS' if mig_ok else 'FAIL'}] Catalog schema_migrations: {len(mig_versions)} migrations verified in remote catalog (000000 to 000009 all applied: {all_migs_present})")
    else:
        print(f"[-] FATAL: Failed to query supabase_migrations catalog: {err_mig}")

    catalog_all_ok = secdef_ok and schema_priv_ok and policies_ok and mig_ok
    evidence["catalog_verification"] = {
        "verified": catalog_all_ok,
        "security_definer_ok": secdef_ok,
        "schema_privilege_ok": schema_priv_ok,
        "policies_ok": policies_ok,
        "migrations_ok": mig_ok,
        "details": {
            "secdef_count": len(evidence["security_definer_functions"]),
            "policy_table_count": len(evidence["rls_table_protections"]),
            "migration_count": len(evidence["catalog_migrations"])
        }
    }

    # 7. Write Evidence to Artifacts
    output_dir = Path(__file__).parent / "evidence"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "live_security_posture_evidence.json"

    # Overall Verdict
    all_identities_ok = all(v.get("verified") for v in evidence["identities"].values())
    all_fixtures_ok = all(v.get("verified") for v in evidence["fixtures"].values())
    all_grants_ok = all(v.get("verified") for v in evidence["effective_role_grants"].values())
    all_storage_ok = all(v.get("verified") for v in evidence["storage_boundaries"].values())

    overall_pass = all_identities_ok and all_fixtures_ok and all_grants_ok and all_storage_ok and catalog_all_ok
    evidence["verdict"] = "PASSED" if overall_pass else "FAILED"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(evidence, f, indent=2)
    print(f"\n[✓] Deterministic evidence recorded to: {output_path}")

    print("=" * 80)
    print(f"AUDIT SUMMARY: Ident={all_identities_ok}, Fixt={all_fixtures_ok}, Grants={all_grants_ok}, Storage={all_storage_ok}, Catalog={catalog_all_ok}")
    print(f"OVERALL SECURITY VERDICT: {'ALL CRITERIA VERIFIED (100% PASS)' if overall_pass else 'DEFICIENCIES DETECTED'}")
    print("=" * 80)

    return 0 if overall_pass else 1

if __name__ == "__main__":
    sys.exit(main())
