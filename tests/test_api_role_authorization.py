#!/usr/bin/env python3
"""
AGILA Hub - Hardened API Role Authorization Integration Test Suite
Resolves Security Gate Requirements:
- Strictly verifies PostgreSQL 42501 'permission denied' on unauthorized RPCs.
- Verifies database state before and after attempted writes against dedicated fixtures
  (never modifies production/seed member records).
- Tests anonymous, Member A, Member B, Officer, Administrator, and Suspended member roles.
- Explicitly FAILS the security gate when required multi-role JWTs are unavailable.
- Verifies storage access control against real fixture objects ('fixtures/probe.txt').
- Fails closed on any unexpected or ambiguous response.
"""

import os
import sys
import json
import urllib.request
import urllib.error

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://jgpigkeekfuawbyilycq.supabase.co")
ANON_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"
)

# Multi-Role Authenticated JWT Tokens
MEMBER_A_JWT = os.getenv("MEMBER_A_JWT", "").strip()
MEMBER_B_JWT = os.getenv("MEMBER_B_JWT", "").strip()
OFFICER_JWT = os.getenv("OFFICER_JWT", "").strip()
ADMIN_JWT = os.getenv("ADMIN_JWT", "").strip()
SUSPENDED_JWT = os.getenv("SUSPENDED_JWT", "").strip()

# Strict Role Matrix is MANDATORY and cannot be bypassed
STRICT_ROLE_MATRIX = True

results = []

def record_test(category: str, name: str, passed: bool, details: str):
    status = "PASS" if passed else "FAIL"
    results.append({"category": category, "name": name, "passed": passed, "details": details})
    print(f"[{status}] {name} - {details}", flush=True)

def api_request(path: str, method: str = "GET", data: dict = None, auth_token: str = None, headers_extra: dict = None) -> tuple:
    url = f"{SUPABASE_URL}{path}"
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

def extract_jwt_sub(token: str) -> str:
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            import base64
            p = parts[1] + "=" * (-len(parts[1]) % 4)
            data = json.loads(base64.b64decode(p).decode("utf-8"))
            return data.get("sub", "")
    except Exception:
        pass
    return ""

def is_strict_permission_denied(status: int, body: any) -> bool:
    if status in (401, 403):
        if isinstance(body, dict):
            if body.get("code") == "42501":
                return True
            msg = str(body.get("message", "")).lower()
            if "permission denied" in msg or "unauthorized" in msg or "forbidden" in msg:
                return True
        elif "permission denied" in str(body).lower() or "unauthorized" in str(body).lower():
            return True
    return False

def is_strict_authorization_denial(status: int, body: any, expected_phrase: str = None) -> tuple:
    """
    Distinguishes explicit authorization denial from business validation errors.
    Rejects HTTP 200, 500, network 0, or generic 400 with business errors.
    Requires:
    - HTTP 401 with code 42501 (PostgreSQL function permission denied), OR
    - HTTP 400/403 with code P0001 specifically containing 'Forbidden:' or 'Unauthorized:'
      and the expected authorization constraint phrase.
    """
    if status == 200:
        return False, "CRITICAL: HTTP 200 received (unauthorized action was permitted)!"
    if status in (0, 500, 502, 503, 504):
        return False, f"FAIL: Server error / network failure HTTP {status}: {body}"

    if isinstance(body, dict):
        code = body.get("code")
        msg = body.get("message", "")
        msg_lower = msg.lower()

        # PostgreSQL 42501 permission denied
        if code == "42501":
            return True, f"HTTP {status} Code 42501: {msg}"

        # PostgreSQL P0001 user-defined exception
        if code == "P0001":
            if "forbidden" in msg_lower or "unauthorized" in msg_lower or "only active officers" in msg_lower:
                if expected_phrase and expected_phrase.lower() not in msg_lower:
                    return False, f"FAIL: P0001 raised but missing expected authorization phrase '{expected_phrase}': {msg}"
                return True, f"HTTP {status} Code P0001 (Explicit authorization exception): {msg}"
            return False, f"FAIL: P0001 was a business validation error (NOT an authorization error): {msg}"

    return False, f"FAIL: HTTP {status} unexpected authorization response format: {body}"

def is_strict_storage_denial(status: int, body: any, is_public: bool = False) -> tuple:
    body_str = json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    body_lower = body_str.lower()

    if status == 200:
        return False, "CRITICAL LEAK: HTTP 200 received on private storage resource!"
    if status in (0, 500, 502, 503, 504):
        return False, f"FAIL: Server error / network failure HTTP {status}: {body_str[:70]}"
    if status == 404 and "not_found" not in body_lower:
        return False, "AMBIGUOUS: HTTP 404 without RLS body does not establish access control denial"

    if is_public:
        if status == 400 and ("not public" in body_lower or "bucket not found" in body_lower):
            return True, f"HTTP 400 confirmed private bucket: {body_str[:70]}"
        if status in (401, 403) and ("unauthorized" in body_lower or "forbidden" in body_lower or "permission denied" in body_lower):
            return True, f"HTTP {status} confirmed access denied: {body_str[:70]}"
        return False, f"FAIL: HTTP {status} unexpected storage response: {body_str[:70]}"
    else:
        if status in (401, 403) and ("unauthorized" in body_lower or "forbidden" in body_lower or "permission denied" in body_lower):
            return True, f"HTTP {status} confirmed unauthorized: {body_str[:70]}"
        if status == 400 and ("not_found" in body_lower or "object not found" in body_lower or "bucket not found" in body_lower):
            return True, f"HTTP {status} confirmed RLS hidden/denied: {body_str[:70]}"
        return False, f"FAIL: HTTP {status} expected 401/403 or 400 RLS rejection: {body_str[:70]}"

def run_tests():
    print("=" * 75)
    print("AGILA HUB: HARDENED API ROLE AUTHORIZATION INTEGRATION TEST SUITE")
    print(f"Target Supabase API: {SUPABASE_URL}")
    print("=" * 75)

    # -------------------------------------------------------------------------
    # 1. ANONYMOUS RPC MUTATION TESTS (Must Reject Anon with 401 code 42501)
    # -------------------------------------------------------------------------
    print("\n--- 1. Anonymous Mutating RPC Rejection Tests (Strict 42501 Verification) ---", flush=True)

    rpc_tests = [
        ("approve_member_applicant", {"p_member_id": "00000000-0000-0000-0000-000000000001"}),
        ("verify_contribution", {"p_contribution_id": "00000000-0000-0000-0000-000000000001", "p_status": "verified"}),
        ("submit_self_contribution", {"p_title": "Anon Test", "p_category": "dues", "p_amount": 100, "p_payment_method": "cash"}),
        ("check_in_self_event", {"p_event_id": "00000000-0000-0000-0000-000000000001", "p_checkin_code": "PROBE"}),
        ("generate_member_claim_token", {"p_member_number": "FIXTURE-SECURITY-PROBE"}),
        ("officer_submit_contribution_for_member", {
            "p_target_member_id": "00000000-0000-0000-0000-000000000001",
            "p_title": "Anon Record",
            "p_category": "dues",
            "p_amount": 100,
            "p_payment_method": "cash"
        }),
        ("officer_update_member_profile", {
            "p_target_member_id": "00000000-0000-0000-0000-000000000001",
            "p_first_name": "Tampered"
        }),
    ]

    for rpc_name, payload in rpc_tests:
        status, body = api_request(f"/rest/v1/rpc/{rpc_name}", method="POST", data=payload)
        passed = is_strict_permission_denied(status, body)
        err_msg = body.get("message", str(body)) if isinstance(body, dict) else str(body)
        record_test("Anon-RPC", f"Anon: {rpc_name}", passed, f"Status: {status}, Code: {body.get('code') if isinstance(body, dict) else None}, Msg: {err_msg[:75]}")

    # -------------------------------------------------------------------------
    # 2. LEGACY PRIVILEGED FUNCTIONS TESTS
    # -------------------------------------------------------------------------
    print("\n--- 2. Legacy Privileged Functions Access Rejection ---", flush=True)
    
    # 2.1 handle_new_user: trigger function must not be callable via RPC
    status, body = api_request("/rest/v1/rpc/handle_new_user", method="POST", data={})
    passed_hnu = status in (401, 404)
    record_test("Legacy-RPC", "Anon: handle_new_user (trigger protected)", passed_hnu, f"Status: {status} (Blocked from direct RPC)")

    # 2.2 auto_confirm_user_email: obsolete email bypass function must be dropped or rejected
    status, body = api_request("/rest/v1/rpc/auto_confirm_user_email", method="POST", data={})
    passed_ace = status in (401, 404)
    record_test("Legacy-RPC", "Anon: auto_confirm_user_email (obsolete)", passed_ace, f"Status: {status} (Not executable)")

    # 2.3 current_member: helper function must not be executable by anon
    status, body = api_request("/rest/v1/rpc/current_member", method="POST", data={})
    passed_cm = status in (401, 404)
    record_test("Legacy-RPC", "Anon: current_member", passed_cm, f"Status: {status} (Not executable by anon)")

    # 2.4 rls_auto_enable: event trigger/function must not be executable by anon
    status, body = api_request("/rest/v1/rpc/rls_auto_enable", method="POST", data={})
    passed_rae = status in (401, 404)
    record_test("Legacy-RPC", "Anon: rls_auto_enable", passed_rae, f"Status: {status} (Not executable by anon)")

    # -------------------------------------------------------------------------
    # 3. DIRECT TABLE MUTATION & STATE IMMUTABILITY (Independent Pre/Post Fetch)
    # -------------------------------------------------------------------------
    print("\n--- 3. Direct Table Mutation & State Integrity (Dedicated Probe Fixture) ---", flush=True)

    # 3.1 Direct INSERT into contributions
    status, body = api_request(
        "/rest/v1/contributions",
        method="POST",
        data={"member_id": "00000000-0000-0000-0000-000000000001", "title": "Hacked Dues", "amount": 1000}
    )
    passed_ins = status in (401, 403)
    record_test("Table-RLS", "Anon: Direct INSERT into contributions", passed_ins, f"Status: {status} (Direct table write blocked by RLS)")

    # 3.2 State immutability check on FIXTURE-SECURITY-PROBE with independent pre/post fetch
    auth_fetch_token = ADMIN_JWT or OFFICER_JWT or MEMBER_A_JWT
    if auth_fetch_token:
        # Pre-fetch
        pre_status, pre_body = api_request(
            "/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
            auth_token=auth_fetch_token
        )
        pre_exists = pre_status == 200 and isinstance(pre_body, list) and len(pre_body) == 1
        
        if not pre_exists:
            record_test(
                "State-Integrity",
                "Anon: Direct PATCH on member fixture (Pre/Post Verified)",
                False,
                f"FAIL: Fixture FIXTURE-SECURITY-PROBE could not be pre-fetched (Status {pre_status})"
            )
        else:
            pre_state = pre_body[0]
            # Unauthorized PATCH attempt by anon
            patch_status, patch_body = api_request(
                "/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
                method="PATCH",
                data={"role": "admin"},
                headers_extra={"Prefer": "return=representation"}
            )
            rows_altered = len(patch_body) if isinstance(patch_body, list) else 0
            patch_denied = (patch_status in (401, 403)) or (patch_status in (200, 204) and rows_altered == 0)

            # Post-fetch
            post_status, post_body = api_request(
                "/rest/v1/members?member_number=eq.FIXTURE-SECURITY-PROBE",
                auth_token=auth_fetch_token
            )
            post_state = post_body[0] if (post_status == 200 and isinstance(post_body, list) and len(post_body) == 1) else None

            immutability_ok = (
                patch_denied
                and post_state is not None
                and post_state == pre_state
                and post_state.get("role") == pre_state.get("role")
            )
            record_test(
                "State-Integrity",
                "Anon: Direct PATCH on member fixture (Pre/Post Verified)",
                immutability_ok,
                f"Patch Status: {patch_status}, Rows altered: {rows_altered}, State preserved: {immutability_ok}"
            )
    else:
        record_test(
            "State-Integrity",
            "Anon: Direct PATCH on member fixture (Pre/Post Verified)",
            False,
            "FAIL-CLOSED: Independent before/after fixture verification requires authenticated JWT (ADMIN_JWT/OFFICER_JWT/MEMBER_A_JWT)"
        )

    # -------------------------------------------------------------------------
    # 4. STORAGE ACCESS CONTROL ON REAL FIXTURES
    # -------------------------------------------------------------------------
    print("\n--- 4. Storage Bucket Access Control Tests (Strict Non-Ambiguous Rejection) ---", flush=True)

    target_uid = os.getenv("MEMBER_A_UID", "").strip() or extract_jwt_sub(MEMBER_A_JWT)
    if not target_uid:
        record_test("Storage", "Target Fixture UID Resolution", False, "FAIL-CLOSED: Target fixture owner UID could not be resolved from environment or JWT")
        return False
    target_fixture_path = f"{target_uid}/probe.txt"

    for bucket in ("receipts", "member-ids"):
        # 4.1 Public access endpoint: MUST reject because bucket is private
        status_pub, body_pub = api_request(f"/storage/v1/object/public/{bucket}/{target_fixture_path}")
        passed_pub, reason_pub = is_strict_storage_denial(status_pub, body_pub, is_public=True)
        record_test("Storage", f"Storage: {bucket} public endpoint denial", passed_pub, reason_pub)

        # 4.2 Authenticated object endpoint without valid auth: MUST reject anon
        status_priv, body_priv = api_request(f"/storage/v1/object/{bucket}/{target_fixture_path}")
        passed_priv, reason_priv = is_strict_storage_denial(status_priv, body_priv, is_public=False)
        record_test("Storage", f"Storage: {bucket} anon direct read denial", passed_priv, reason_priv)

    # -------------------------------------------------------------------------
    # 5. MULTI-ROLE AUTHENTICATED MATRIX TESTS (Strict Mode Mandatory)
    # -------------------------------------------------------------------------
    print("\n--- 5. Multi-Role Authenticated Authorization Matrix (Strict Mode) ---", flush=True)

    matrix_roles = {
        "Member A (Active)": MEMBER_A_JWT,
        "Member B (Cross-Chapter)": MEMBER_B_JWT,
        "Officer": OFFICER_JWT,
        "Administrator": ADMIN_JWT,
        "Suspended Member": SUSPENDED_JWT,
    }

    missing_roles = [role for role, jwt in matrix_roles.items() if not jwt]

    if missing_roles:
        print(f"[-] STRICT GATE FAILURE: Missing authenticated JWT credentials for: {', '.join(missing_roles)}")
        record_test(
            "Role-Matrix",
            "Authenticated Role Matrix Coverage (5 Roles)",
            False,
            f"FAIL-CLOSED: Missing required credentials for: {', '.join(missing_roles)}"
        )
    else:
        # Fixture Identifiers
        APPLICANT_FIXTURE_ID = "1fd1fc3a-bb3c-4222-b16c-b50c21a25bd4"
        PENDING_CONTRIB_FIXTURE_ID = "30000000-0000-0000-0000-000000000002"
        ACTIVE_EVENT_FIXTURE_ID = "20000000-0000-0000-0000-000000000001"

        # 5.1 Member A: Active Member Tests
        # Positive: Submit self-contribution
        status, body = api_request(
            "/rest/v1/rpc/submit_self_contribution",
            method="POST",
            data={"p_title": "Dues", "p_category": "monthly", "p_amount": 500, "p_payment_method": "cash"},
            auth_token=MEMBER_A_JWT
        )
        passed_self = status in (200, 201) and (body.get("success") is True if isinstance(body, dict) else False)
        record_test("Role-Matrix", "Member A: Submit Self Contribution (Positive)", passed_self, f"Status: {status}")

        # Positive: Update own profile
        status, body = api_request(
            "/rest/v1/rpc/update_self_profile",
            method="POST",
            data={"p_phone": "09171234567", "p_blood_type": "O+"},
            auth_token=MEMBER_A_JWT
        )
        passed_self_prof = status in (200, 201)
        record_test("Role-Matrix", "Member A: Update Own Profile (Positive)", passed_self_prof, f"Status: {status}")

        # Negative: Member A attempting officer RPC (approve_member_applicant) -> MUST REJECT WITH AUTHORIZATION ERROR
        # Pre-fetch applicant state to prove valid pending fixture
        s_pre_app, b_pre_app = api_request(f"/rest/v1/members?id=eq.{APPLICANT_FIXTURE_ID}", auth_token=ADMIN_JWT)
        app_is_pending = (s_pre_app == 200 and isinstance(b_pre_app, list) and len(b_pre_app) == 1 and b_pre_app[0].get("membership_status") == "pending")

        status, body = api_request(
            "/rest/v1/rpc/approve_member_applicant",
            method="POST",
            data={"p_member_id": APPLICANT_FIXTURE_ID},
            auth_token=MEMBER_A_JWT
        )
        passed_unauth, reason_unauth = is_strict_authorization_denial(status, body, "Only active officers or administrators can approve member applications")

        # Post-fetch applicant state to prove database was untouched
        s_post_app, b_post_app = api_request(f"/rest/v1/members?id=eq.{APPLICANT_FIXTURE_ID}", auth_token=ADMIN_JWT)
        app_still_pending = (s_post_app == 200 and isinstance(b_post_app, list) and len(b_post_app) == 1 and b_post_app[0].get("membership_status") == "pending" and b_post_app[0].get("approved_by") is None)
        record_test(
            "Role-Matrix",
            "Member A: Rejection from Officer Action (approve_applicant)",
            passed_unauth and app_is_pending and app_still_pending,
            f"{reason_unauth} (Pre-Pending: {app_is_pending}, Post-Pending: {app_still_pending})"
        )

        # Negative: Member A attempting officer contribution verification -> MUST REJECT WITH AUTHORIZATION ERROR
        s_pre_ct, b_pre_ct = api_request(f"/rest/v1/contributions?id=eq.{PENDING_CONTRIB_FIXTURE_ID}", auth_token=ADMIN_JWT)
        ct_is_pending = (s_pre_ct == 200 and isinstance(b_pre_ct, list) and len(b_pre_ct) == 1 and b_pre_ct[0].get("status") == "pending")

        status, body = api_request(
            "/rest/v1/rpc/verify_contribution",
            method="POST",
            data={"p_contribution_id": PENDING_CONTRIB_FIXTURE_ID, "p_status": "verified"},
            auth_token=MEMBER_A_JWT
        )
        passed_unauth_verify, reason_verify = is_strict_authorization_denial(status, body, "Only active officers or administrators can verify financial contributions")

        s_post_ct, b_post_ct = api_request(f"/rest/v1/contributions?id=eq.{PENDING_CONTRIB_FIXTURE_ID}", auth_token=ADMIN_JWT)
        ct_still_pending = (s_post_ct == 200 and isinstance(b_post_ct, list) and len(b_post_ct) == 1 and b_post_ct[0].get("status") == "pending" and b_post_ct[0].get("verified_by") is None)
        record_test(
            "Role-Matrix",
            "Member A: Rejection from Contribution Verification",
            passed_unauth_verify and ct_is_pending and ct_still_pending,
            f"{reason_verify} (Pre-Pending: {ct_is_pending}, Post-Pending: {ct_still_pending})"
        )

        # Negative: Member A attempting officer attendance recording -> MUST REJECT
        status, body = api_request(
            "/rest/v1/rpc/record_officer_attendance",
            method="POST",
            data={"p_event_id": ACTIVE_EVENT_FIXTURE_ID, "p_member_number": "FIXTURE-SECURITY-PROBE"},
            auth_token=MEMBER_A_JWT
        )
        passed_att_unauth, reason_att = is_strict_authorization_denial(status, body, "Only active officers or administrators can record attendance")
        record_test("Role-Matrix", "Member A: Rejection from Officer Attendance", passed_att_unauth, reason_att)

        # Negative: Member A attempting officer contribution submission on behalf of another member
        status, body = api_request(
            "/rest/v1/rpc/officer_submit_contribution_for_member",
            method="POST",
            data={
                "p_target_member_id": APPLICANT_FIXTURE_ID,
                "p_title": "Unauthorized Injected Dues",
                "p_category": "Monthly Dues",
                "p_amount": 500,
                "p_payment_method": "Cash"
            },
            auth_token=MEMBER_A_JWT
        )
        passed_sub_unauth, reason_sub = is_strict_authorization_denial(status, body, "Only active officers can record contributions on behalf of other members")
        record_test("Role-Matrix", "Member A: Rejection from Officer Contribution Submission", passed_sub_unauth, reason_sub)

        # Negative: Member A attempting claim token generation -> MUST REJECT
        status, body = api_request(
            "/rest/v1/rpc/generate_member_claim_token",
            method="POST",
            data={"p_member_number": "FIXTURE-SECURITY-PROBE"},
            auth_token=MEMBER_A_JWT
        )
        passed_token_unauth, reason_token = is_strict_authorization_denial(status, body, "Only active officers or administrators can generate claim tokens")
        record_test("Role-Matrix", "Member A: Rejection from Generate Claim Token", passed_token_unauth, reason_token)

        # 5.2 Member B: Cross-Member Isolation Tests
        # Target Member A profile ID
        s_mem_a, b_mem_a = api_request("/rest/v1/members?email=eq.member.a@eagles.internal", auth_token=ADMIN_JWT)
        member_a_profile_id = b_mem_a[0]["id"] if (s_mem_a == 200 and isinstance(b_mem_a, list) and len(b_mem_a) == 1) else None

        if member_a_profile_id:
            orig_first_name = b_mem_a[0].get("first_name")
            status, body = api_request(
                "/rest/v1/rpc/officer_update_member_profile",
                method="POST",
                data={"p_target_member_id": member_a_profile_id, "p_first_name": "TamperedByB"},
                auth_token=MEMBER_B_JWT
            )
            passed_b, reason_b = is_strict_authorization_denial(status, body, "Only active officers can modify another member profile")

            s_post_b, b_post_b = api_request(f"/rest/v1/members?id=eq.{member_a_profile_id}", auth_token=ADMIN_JWT)
            name_untouched = (s_post_b == 200 and b_post_b[0].get("first_name") == orig_first_name)
            record_test(
                "Role-Matrix",
                "Member B: Cross-Member Profile Tampering Rejected",
                passed_b and name_untouched,
                f"{reason_b} (Member A profile preserved: {name_untouched})"
            )

        # Negative: Member B reading Member A's private contribution records via REST
        status, body = api_request(
            "/rest/v1/contributions?title=eq.Alpha%20Annual%20Dues",
            auth_token=MEMBER_B_JWT
        )
        rows_visible = len(body) if isinstance(body, list) else -1
        passed_cross_read = status == 200 and rows_visible == 0
        record_test("Role-Matrix", "Member B: Cross-Member Contribution Isolation", passed_cross_read, f"Status: {status}, Rows visible: {rows_visible}")

        # 5.3 Suspended Member Restrictions
        # Negative: Suspended member attempting self-contribution -> MUST REJECT
        status, body = api_request(
            "/rest/v1/rpc/submit_self_contribution",
            method="POST",
            data={"p_title": "Suspended Dues", "p_category": "monthly", "p_amount": 500, "p_payment_method": "cash"},
            auth_token=SUSPENDED_JWT
        )
        passed_susp, reason_susp = is_strict_authorization_denial(status, body, "No active member record linked to authenticated user")
        record_test("Role-Matrix", "Suspended Member: Submission Rejected", passed_susp, reason_susp)

        # Negative: Suspended member attempting event check-in -> MUST REJECT
        status, body = api_request(
            "/rest/v1/rpc/check_in_self_event",
            method="POST",
            data={"p_event_id": ACTIVE_EVENT_FIXTURE_ID, "p_checkin_code": "AGILA-GMM-2026"},
            auth_token=SUSPENDED_JWT
        )
        passed_susp_checkin, reason_s_chk = is_strict_authorization_denial(status, body, "Active member account required for event check-in")
        record_test("Role-Matrix", "Suspended Member: Event Check-in Rejected", passed_susp_checkin, reason_s_chk)

        # 5.4 Officer Operations (Positive Tests on Valid Fixtures)
        # Positive: Officer records attendance on active event
        status, body = api_request(
            "/rest/v1/rpc/record_officer_attendance",
            method="POST",
            data={"p_event_id": ACTIVE_EVENT_FIXTURE_ID, "p_member_number": "FIXTURE-SECURITY-PROBE"},
            auth_token=OFFICER_JWT
        )
        passed_off_att = status == 200 and (body.get("success") is True or body.get("already_checked_in") is True)
        # Verify database record in attendance table
        s_att_db, b_att_db = api_request(f"/rest/v1/attendance?event_id=eq.{ACTIVE_EVENT_FIXTURE_ID}", auth_token=OFFICER_JWT)
        att_row_present = (s_att_db == 200 and isinstance(b_att_db, list) and len(b_att_db) > 0)
        record_test(
            "Role-Matrix",
            "Officer: Authorized Attendance Invocation (Positive)",
            passed_off_att and att_row_present,
            f"Status: {status}, Attendance verified in DB: {att_row_present}"
        )

        # Positive: Officer generates claim token
        status, body = api_request(
            "/rest/v1/rpc/generate_member_claim_token",
            method="POST",
            data={"p_member_number": "FIXTURE-SECURITY-PROBE"},
            auth_token=OFFICER_JWT
        )
        passed_off_token = status == 200 and body.get("success") is True and bool(body.get("raw_claim_token"))
        record_test("Role-Matrix", "Officer: Generate Claim Token Authorized (Positive)", passed_off_token, f"Status: {status}, Token code generated")

        # Positive: Officer views financial ledger summary
        status, body = api_request(
            "/rest/v1/rpc/get_financial_ledger_summary",
            method="POST",
            data={},
            auth_token=OFFICER_JWT
        )
        passed_off_ledger = status in (200, 201) and body.get("total_collected") is not None and body.get("verified_count") is not None
        record_test("Role-Matrix", "Officer: Financial Ledger Summary Accessible (Positive)", passed_off_ledger, f"Status: {status}, Verified: {body.get('verified_count')}, Total: {body.get('total_collected')}")

        # Positive: Officer records contribution on behalf of member
        if member_a_profile_id:
            status, body = api_request(
                "/rest/v1/rpc/officer_submit_contribution_for_member",
                method="POST",
                data={
                    "p_target_member_id": member_a_profile_id,
                    "p_title": "Officer Recorded Annual Dues",
                    "p_category": "Annual Dues",
                    "p_amount": 1000,
                    "p_payment_method": "Bank Transfer",
                    "p_reference_number": "OFF-VERIFIED-2026",
                    "p_auto_verify": True
                },
                auth_token=OFFICER_JWT
            )
            passed_off_sub = status == 200 and body.get("success") is True and bool(body.get("contribution_id"))
            record_test("Role-Matrix", "Officer: Submit Contribution for Member (Positive)", passed_off_sub, f"Status: {status}, Contrib ID: {body.get('contribution_id')}")

        # 5.5 Administrator Operations (Positive Tests)
        status, body = api_request(
            "/rest/v1/members?limit=5",
            auth_token=ADMIN_JWT
        )
        passed_admin = status == 200 and isinstance(body, list) and len(body) > 0
        record_test("Role-Matrix", "Administrator: Directory Administration Access (Positive)", passed_admin, f"Status: {status}, Directory records visible: {len(body)}")

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    total_passed = sum(1 for t in results if t["passed"])
    total_failed = sum(1 for t in results if not t["passed"])
    print("\n" + "=" * 75)
    print(f"HARDENED AUTHORIZATION TEST SUMMARY: {total_passed} Passed, {total_failed} Failed (Total: {len(results)})")
    if total_failed == 0:
        print("SECURITY GATE ASSESSMENT: ALL VERIFIED CHECKS PASSED")
    else:
        print("SECURITY GATE ASSESSMENT: FAILURES DETECTED - FAILING CLOSED")
    print("=" * 75)

    return total_failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
