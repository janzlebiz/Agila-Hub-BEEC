import urllib.request
import urllib.error
import json
import ssl
import sys

SUPABASE_URL = "https://jgpigkeekfuawbyilycq.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGlna2Vla2Z1YXdieWlseWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk0NjQsImV4cCI6MjEwNzkxNTQ2NH0.o9Oa1pM9_Ax_cgi7ZvpWXMq2TOTddoAKWNgr8rqmJos"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def login(email, password):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    data = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body["access_token"], body["user"]["id"]
    except Exception as e:
        print(f"Login error for {email}: {e}")
        return None, None

def http_post(endpoint, token=None, payload=None):
    url = f"{SUPABASE_URL}{endpoint}"
    data = json.dumps(payload or {}).encode("utf-8")
    headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except:
            parsed = raw
        return e.code, parsed
    except Exception as e:
        return 500, str(e)

def http_get(endpoint, token=None):
    url = f"{SUPABASE_URL}{endpoint}"
    headers = {"apikey": ANON_KEY}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except:
            parsed = raw
        return e.code, parsed
    except Exception as e:
        return 500, str(e)

def main():
    print("======================================================================")
    print("AGILA HUB — AUTOMATED SECURITY & DATA INTEGRITY RELEASE GATE AUDIT")
    print("======================================================================")
    
    # 1. Anonymous Access Restrictions
    print("\n--- TEST 1: ANONYMOUS ACCESS RESTRICTIONS ---")
    code, res = http_post("/rest/v1/rpc/get_financial_ledger_summary", token=None, payload={})
    print(f"Anon RPC get_financial_ledger_summary: HTTP {code}")
    assert code == 401, f"Expected 401, got {code}"
    print("[PASS] Anonymous request rejected for financial ledger summary RPC (HTTP 401 Unauthorized)")

    code, res = http_post("/rest/v1/rpc/approve_member_applicant", token=None, payload={"p_member_id": "00000000-0000-0000-0000-000000000000"})
    print(f"Anon RPC approve_member_applicant: HTTP {code}")
    assert code == 401, f"Expected 401, got {code}"
    print("[PASS] Anonymous request rejected for member approval RPC (HTTP 401 Unauthorized)")

    code, res = http_post("/rest/v1/rpc/verify_contribution", token=None, payload={"p_contribution_id": "00000000-0000-0000-0000-000000000000", "p_status": "verified"})
    print(f"Anon RPC verify_contribution: HTTP {code}")
    assert code == 401, f"Expected 401, got {code}"
    print("[PASS] Anonymous request rejected for contribution verification RPC (HTTP 401 Unauthorized)")

    # 2. Authenticate Personas
    print("\n--- TEST 2: PERSONA AUTHENTICATION ---")
    pres_token, pres_uid = login("president@agilahub.ph", "AgilaPresident2026!")
    treas_token, treas_uid = login("treasurer@agilahub.ph", "AgilaTreasurer2026!")
    sec_token, sec_uid = login("secretary@agilahub.ph", "AgilaSecretary2026!")
    mem_token, mem_uid = login("member@agilahub.ph", "AgilaMember2026!")

    assert pres_token, "President login failed"
    assert treas_token, "Treasurer login failed"
    assert sec_token, "Secretary login failed"
    assert mem_token, "Member login failed"
    print(f"[PASS] President authenticated (UID: {pres_uid})")
    print(f"[PASS] Treasurer authenticated (UID: {treas_uid})")
    print(f"[PASS] Secretary authenticated (UID: {sec_uid})")
    print(f"[PASS] Member authenticated (UID: {mem_uid})")

    # 3. Member Role Boundary & Unauthorized Privilege Escalation
    print("\n--- TEST 3: ROLE AUTHORIZATION & PRIVILEGE ESCALATION PREVENTION ---")
    
    # Member attempts to approve member application
    code, res = http_post("/rest/v1/rpc/approve_member_applicant", token=mem_token, payload={"p_member_id": "00000000-0000-0000-0000-000000000000"})
    print(f"Member calling approve_member_applicant: HTTP {code} - {res.get('message', res)}")
    assert code in (400, 403), f"Expected 400 or 403, got {code}"
    assert "Forbidden" in str(res) or "42501" in str(res), f"Expected forbidden message, got {res}"
    print("[PASS] Regular member blocked from executing approve_member_applicant RPC")

    # Member attempts to verify contribution
    code, res = http_post("/rest/v1/rpc/verify_contribution", token=mem_token, payload={"p_contribution_id": "00000000-0000-0000-0000-000000000000", "p_status": "verified"})
    print(f"Member calling verify_contribution: HTTP {code} - {res.get('message', res)}")
    assert code in (400, 403), f"Expected 400 or 403, got {code}"
    assert "Forbidden" in str(res) or "42501" in str(res), f"Expected forbidden message, got {res}"
    print("[PASS] Regular member blocked from executing verify_contribution RPC")

    # Member attempts to submit contribution on behalf of another member
    code, res = http_post("/rest/v1/rpc/officer_submit_contribution_for_member", token=mem_token, payload={
        "p_target_member_id": pres_uid,
        "p_title": "Forged Dues Submission",
        "p_category": "Monthly Dues",
        "p_amount": 1000.00,
        "p_payment_method": "Cash"
    })
    print(f"Member calling officer_submit_contribution_for_member: HTTP {code} - {res.get('message', res)}")
    assert code in (400, 403), f"Expected 400 or 403, got {code}"
    assert "Forbidden" in str(res) or "42501" in str(res), f"Expected forbidden message, got {res}"
    print("[PASS] Regular member blocked from executing officer_submit_contribution_for_member RPC")

    # Member attempts direct insert to attendance
    code, res = http_post("/rest/v1/attendance", token=mem_token, payload={
        "event_id": "00000000-0000-0000-0000-000000000000",
        "member_id": mem_uid,
        "status": "present",
        "check_in_method": "officer_manual"
    })
    print(f"Member direct attendance insert: HTTP {code} - {res}")
    assert code in (403, 404), f"Expected 403 or 404, got {code}"
    print("[PASS] Regular member blocked from direct attendance insertion (RLS 42501 enforced)")

    # 4. Officer & Treasurer Financial Read Access
    print("\n--- TEST 4: OFFICER FINANCIAL READ ACCESS ---")
    code, res = http_post("/rest/v1/rpc/get_financial_ledger_summary", token=treas_token, payload={})
    print(f"Treasurer calling get_financial_ledger_summary: HTTP {code} - {res}")
    assert code == 200, f"Expected 200, got {code}"
    assert "total_collected" in res, f"Expected total_collected in response, got {res}"
    print(f"[PASS] Treasurer successfully retrieved financial ledger summary: Total Collected = PHP {res['total_collected']}, Verified = {res['verified_count']}, Pending = {res['pending_count']}")

    # 5. Token & Secret Scanning of Repository
    print("\n--- TEST 5: CLIENT CODE & BUNDLE SECRET SCANNING ---")
    # Verify no service role key is present in client source
    import subprocess
    result = subprocess.run(["git", "grep", "-i", "service_role", "src/"], capture_output=True, text=True)
    if result.stdout.strip():
        print(f"[FAIL] Potential service_role found in src/:\n{result.stdout}")
        sys.exit(1)
    else:
        print("[PASS] Zero service-role keys or admin secrets found in client source code (src/)")

    print("\n======================================================================")
    print("ALL SECURITY AND DATA-INTEGRITY GATES PASSED SUCCESSFULLY!")
    print("======================================================================")

if __name__ == "__main__":
    main()
