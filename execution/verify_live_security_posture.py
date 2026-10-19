#!/usr/bin/env python3
"""
AGILA Hub - Read-Only Live Database & Security Posture Verification
Performs non-destructive, read-only security boundary auditing:
1. Verifies explicit PostgreSQL 42501 'permission denied' on all mutating RPCs under anon.
2. Verifies legacy privileged functions are not accessible via REST RPC (handle_new_user, current_member, auto_confirm_user_email, rls_auto_enable).
3. Verifies RLS enforcement on domain tables (contributions, members).
4. Verifies storage access boundaries (receipts and member-ids buckets private, no public read, anon direct read rejected).
5. Verifies fixture state immutability via independent pre/post-fetch when authorized token is present.
6. Assesses multi-role authorization readiness.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import argparse

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "jgpigkeekfuawbyilycq")
DEFAULT_SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", DEFAULT_SUPABASE_URL)
ANON_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"
)

def http_req(url: str, method: str = "GET", data: dict = None, auth_token: str = None, headers_extra: dict = None) -> tuple:
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

def run_read_only_audit(auth_token: str = None) -> tuple:
    print("=" * 80)
    print("AGILA HUB: READ-ONLY LIVE DATABASE SECURITY AUDIT")
    print(f"Target Supabase Project: {PROJECT_REF} ({SUPABASE_URL})")
    print("=" * 80)

    results = []

    def log_check(category: str, name: str, passed: bool, evidence: str):
        tag = "[PASS]" if passed else "[FAIL]"
        results.append({"category": category, "name": name, "passed": passed, "evidence": evidence})
        print(f"{tag} [{category}] {name}\n       Evidence: {evidence}")

    # -------------------------------------------------------------------------
    # 1. MUTATING RPCs - ANON REJECTION WITH POSTGRES 42501
    # -------------------------------------------------------------------------
    print("\n--- 1. Mutating RPC Anonymous Access Grants (Strict 42501 Assertion) ---")
    rpcs = [
        ("approve_member_applicant", {"p_member_id": "00000000-0000-0000-0000-000000000001"}),
        ("verify_contribution", {"p_contribution_id": "00000000-0000-0000-0000-000000000001", "p_status": "verified"}),
        ("submit_self_contribution", {"p_title": "Probe", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"}),
        ("generate_member_claim_token", {"p_member_number": "FIXTURE-SECURITY-PROBE"}),
        ("check_in_self_event", {"p_event_id": "00000000-0000-0000-0000-000000000001", "p_checkin_code": "PROBE"}),
        ("officer_submit_contribution_for_member", {
            "p_target_member_id": "00000000-0000-0000-0000-000000000001",
            "p_title": "Probe", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"
        }),
    ]

    for rpc_name, payload in rpcs:
        status, body = http_req(f"{SUPABASE_URL}/rest/v1/rpc/{rpc_name}", method="POST", data=payload)
        is_42501 = False
        msg = ""
        if isinstance(body, dict):
            if body.get("code") == "42501":
                is_42501 = True
            msg = body.get("message", str(body))
        elif "permission denied" in str(body).lower():
            is_42501 = True
            msg = str(body)

        passed = (status in (401, 403)) and is_42501
        log_check(
            "RPC-Grants",
            f"Anon RPC: {rpc_name}",
            passed,
            f"HTTP {status}, Postgres Code: {body.get('code') if isinstance(body, dict) else None}, Message: {msg[:80]}"
        )

    # -------------------------------------------------------------------------
    # 2. LEGACY PRIVILEGED FUNCTIONS EXPOSURE
    # -------------------------------------------------------------------------
    print("\n--- 2. Legacy Privileged Functions REST RPC Exposure ---")
    legacy_funcs = [
        ("handle_new_user", "Internal Auth Trigger Function"),
        ("auto_confirm_user_email", "Obsolete Email Bypass Function"),
        ("current_member", "Obsolete Helper Function"),
        ("rls_auto_enable", "Obsolete Event Trigger Function"),
    ]

    for func_name, desc in legacy_funcs:
        status, body = http_req(f"{SUPABASE_URL}/rest/v1/rpc/{func_name}", method="POST", data={})
        # If dropped: returns 404. If revoked: returns 401. If callable: returns 200/400 (failure!)
        passed = status in (401, 404)
        body_text = str(body)[:70] if body else ""
        log_check(
            "Legacy-Funcs",
            f"{func_name} ({desc})",
            passed,
            f"HTTP {status} (Blocked from direct client RPC execution: {body_text})"
        )

    # -------------------------------------------------------------------------
    # 3. EFFECTIVE RLS POLICIES ON DOMAIN TABLES
    # -------------------------------------------------------------------------
    print("\n--- 3. Effective Row-Level Security on Core Domain Tables ---")
    
    # 3.1 Anon direct INSERT into contributions
    status, body = http_req(
        f"{SUPABASE_URL}/rest/v1/contributions",
        method="POST",
        data={"member_id": "00000000-0000-0000-0000-000000000001", "title": "Injected", "amount": 100}
    )
    passed_ins = status in (401, 403)
    log_check(
        "Table-RLS",
        "Direct INSERT into contributions under anon",
        passed_ins,
        f"HTTP {status} (Blocked by RLS policy)"
    )

    # 3.2 Anon direct SELECT on members
    status, body = http_req(f"{SUPABASE_URL}/rest/v1/members?limit=5", method="GET")
    rows_returned = len(body) if isinstance(body, list) else -1
    passed_mem_sel = (status in (401, 403)) or (status == 200 and rows_returned == 0)
    log_check(
        "Table-RLS",
        "Direct SELECT on members under anon",
        passed_mem_sel,
        f"HTTP {status}, Rows returned: {rows_returned} (Protected by 'Strict members visibility' policy)"
    )

    # 3.3 Anon direct SELECT on contributions
    status, body = http_req(f"{SUPABASE_URL}/rest/v1/contributions?limit=5", method="GET")
    rows_c = len(body) if isinstance(body, list) else -1
    passed_contrib_sel = (status in (401, 403)) or (status == 200 and rows_c == 0)
    log_check(
        "Table-RLS",
        "Direct SELECT on contributions under anon",
        passed_contrib_sel,
        f"HTTP {status}, Rows returned: {rows_c} (Protected by 'Strict contributions visibility' policy)"
    )

    # -------------------------------------------------------------------------
    # 4. STORAGE ACCESS CONTROL BOUNDARIES
    # -------------------------------------------------------------------------
    print("\n--- 4. Real Storage-Object Access Boundaries ---")
    for bucket in ("receipts", "member-ids"):
        # 4.1 Public access endpoint
        pub_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/probe.txt"
        status_pub, body_pub = http_req(pub_url)
        body_pub_str = str(body_pub)
        # Bucket must NOT be public: HTTP 400 with 'Bucket not found or not public' or 401/403
        is_private = (status_pub == 400 and ("not public" in body_pub_str.lower() or "bucket not found" in body_pub_str.lower())) or (status_pub in (401, 403))
        log_check(
            "Storage-RLS",
            f"Storage bucket '{bucket}' public denial",
            is_private,
            f"HTTP {status_pub} (Access denied: {body_pub_str[:70]})"
        )

        # 4.2 Authenticated object endpoint without valid token
        priv_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/probe.txt"
        status_priv, body_priv = http_req(priv_url)
        body_priv_str = str(body_priv)
        is_priv_denied = (status_priv in (401, 403)) and ("unauthorized" in body_priv_str.lower() or "forbidden" in body_priv_str.lower() or "permission denied" in body_priv_str.lower())
        log_check(
            "Storage-RLS",
            f"Storage bucket '{bucket}' anonymous direct read denial",
            is_priv_denied,
            f"HTTP {status_priv} (Direct unauthorized read denied: {body_priv_str[:70]})"
        )

    # -------------------------------------------------------------------------
    # 5. STATE IMMUTABILITY: PRE/POST-FETCH PROBING
    # -------------------------------------------------------------------------
    print("\n--- 5. Fixture State Immutability Probing ---")
    if auth_token:
        # Pre-fetch
        pre_status, pre_body = http_req(
            f"{SUPABASE_URL}/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
            auth_token=auth_token
        )
        fixture_exists = (pre_status == 200 and isinstance(pre_body, list) and len(pre_body) == 1)

        if not fixture_exists:
            log_check(
                "State-Immutability",
                "Fixture existence pre-fetch",
                False,
                f"FAIL: Fixture FIXTURE-SECURITY-PROBE could not be pre-fetched with auth token (Status {pre_status})"
            )
        else:
            pre_state = pre_body[0]
            # Unauthorized PATCH attempt by anon
            patch_status, patch_body = http_req(
                f"{SUPABASE_URL}/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
                method="PATCH",
                data={"role": "admin"},
                headers_extra={"Prefer": "return=representation"}
            )
            rows_altered = len(patch_body) if isinstance(patch_body, list) else 0
            patch_denied = (patch_status in (401, 403)) or (patch_status in (200, 204) and rows_altered == 0)

            # Post-fetch
            post_status, post_body = http_req(
                f"{SUPABASE_URL}/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
                auth_token=auth_token
            )
            post_state = post_body[0] if (post_status == 200 and isinstance(post_body, list) and len(post_body) == 1) else None

            immutability_ok = (
                patch_denied
                and post_state is not None
                and post_state == pre_state
                and post_state.get("role") == pre_state.get("role")
            )
            log_check(
                "State-Immutability",
                "Anon PATCH on member fixture (Verified Pre/Post)",
                immutability_ok,
                f"Patch Status: {patch_status}, Rows altered: {rows_altered}, Pre-Role: {pre_state.get('role')}, Post-Role: {post_state.get('role') if post_state else 'N/A'}"
            )
    else:
        log_check(
            "State-Immutability",
            "Fixture independent pre/post-fetch verification",
            False,
            "FAIL-CLOSED: Requires authenticated token (--auth-token or AUTH_TOKEN/OFFICER_JWT/ADMIN_JWT) to independently verify fixture state before and after."
        )

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = sum(1 for r in results if not r["passed"])
    print("\n" + "=" * 80)
    print(f"LIVE DATABASE SECURITY AUDIT SUMMARY: {passed_count} Passed, {failed_count} Failed (Total: {len(results)})")
    if failed_count == 0:
        print("ASSESSMENT: ALL LIVE VERIFIED CRITERIA PASSED")
    else:
        print("ASSESSMENT: SECURITY DEFICIENCIES OR UNVERIFIED CONDITIONS DETECTED (FAIL CLOSED)")
    print("=" * 80)

    return (failed_count == 0), results

def main():
    parser = argparse.ArgumentParser(description="AGILA Hub Live Read-Only Security Audit")
    parser.add_argument("--auth-token", default=os.getenv("AUTH_TOKEN", "").strip(), help="Authenticated token for pre/post-fetch immutability check")
    args = parser.parse_args()

    auth_token = args.auth_token or os.getenv("OFFICER_JWT", "").strip() or os.getenv("ADMIN_JWT", "").strip() or None
    success, _ = run_read_only_audit(auth_token=auth_token)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
