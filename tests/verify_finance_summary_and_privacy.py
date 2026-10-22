#!/usr/bin/env python3
import sys
import time
import socket
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

# Set stdout encoding for Windows compatibility
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = Path("d:/Antigravity/Agila Hub")
OUT_DIR = REPO_ROOT / "out"
ARTIFACT_DIR = Path(r"C:\Users\Chester Jan\.gemini\antigravity-ide\brain\1821233f-7877-49ca-b02f-22e6af2b6f12")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

def main():
    port = get_free_port()
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(OUT_DIR), **kwargs)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    base_url = f"http://127.0.0.1:{port}"
    print(f"[TEST] Serving packaged app on {base_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )

        # -------------------------------------------------------------
        # TEST 1: PRESIDENT / OFFICER VIEW (Summary + All Chapter Dues)
        # -------------------------------------------------------------
        context_admin = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
        )
        page_admin = context_admin.new_page()
        page_admin.goto(base_url)
        page_admin.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login as President
        pres_btn = page_admin.locator('button[data-persona="president"]')
        if pres_btn.is_visible():
            print("[TEST] Unauthenticated onboarding visible. Logging in as President...")
            pres_btn.click()
            page_admin.wait_for_selector("header", timeout=15000)
            time.sleep(1)

        # Navigate to Finance Tab
        page_admin.locator('button[data-tab="ledger"]').click()
        time.sleep(1.5)

        # Verify Summary Dashboard Heading & Cards
        summary_title = page_admin.locator('text=Chapter Treasury & Financial Reserves Summary')
        assert summary_title.is_visible(), "Summary Dashboard header should be visible"
        print("[TEST] Verified 'Chapter Treasury & Financial Reserves Summary' dashboard is visible.")

        transparency_badge = page_admin.locator('text=Fraternal Transparency Active')
        assert transparency_badge.is_visible(), "Fraternal Transparency Active badge should be visible"
        print("[TEST] Verified Fraternal Transparency badge.")

        # Check 4 Core Financial Summary Cards:
        # 1. Net Treasury Reserves
        assert page_admin.locator('text=Net Treasury Reserves').first.is_visible(), "Net Treasury Reserves card should be visible"
        # 2. Contributions & Dues Inflow
        assert page_admin.locator('text=Contributions & Dues').first.is_visible(), "Contributions & Dues summary card should be visible"
        # 3. Donations & Pledges Inflow
        assert page_admin.locator('text=Donations & Pledges').first.is_visible(), "Donations & Pledges summary card should be visible"
        # 4. Total Released Expenses
        assert page_admin.locator('text=Total Released Expenses').first.is_visible(), "Total Released Expenses card should be visible"
        print("[TEST] Verified all 4 core summary cards (Net Reserves, Contributions, Donations, Expenses).")

        # Verify Officer Scope Toggle
        scope_all_btn = page_admin.locator('#btn-filter-dues-all')
        scope_mine_btn = page_admin.locator('#btn-filter-dues-mine')
        assert scope_all_btn.is_visible(), "Officer should have 'All Chapter' scope button"
        assert scope_mine_btn.is_visible(), "Officer should have 'My Personal Dues' scope button"
        print("[TEST] Verified Officer Scope toggle (All Chapter vs My Personal Dues).")

        # Check that officer sees other members' contributions with member names
        antonio_due = page_admin.locator('text=Kuya/Ate Antonio Luna').first
        assert antonio_due.is_visible(), "Officer should see Antonio Luna's contribution record"
        print("[TEST] Verified Officer can view all members' contributions (including Antonio Luna).")

        # Capture Screenshot of President / Officer Finance View
        page_admin.screenshot(path=str(ARTIFACT_DIR / "18_finance_summary_officer_view.png"))

        # Test toggling to 'My Personal Dues' as President
        scope_mine_btn.click()
        time.sleep(0.5)
        mine_heading = page_admin.locator('text=My Personal Contributions & Dues')
        assert mine_heading.is_visible(), "Scope should switch to My Personal Contributions & Dues"
        print("[TEST] Officer successfully filtered to personal dues.")

        context_admin.close()

        # -------------------------------------------------------------
        # TEST 2: REGULAR MEMBER VIEW (Summary Visible, Personal Dues Only)
        # -------------------------------------------------------------
        print("\n[TEST] Launching new session as Regular Member (Kuya Antonio Luna)...")
        context_member = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
        )
        page_member = context_member.new_page()
        page_member.goto(base_url)
        page_member.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login as Regular Member
        mem_btn = page_member.locator('button[data-persona="member"]')
        assert mem_btn.is_visible(), "Member login button should be visible"
        mem_btn.click()
        page_member.wait_for_selector("header", timeout=15000)
        time.sleep(1)

        # Navigate to Finance Tab as Member
        page_member.locator('button[data-tab="ledger"]').click()
        time.sleep(1.5)

        # 1. Member CAN view the Summary Dashboard (Fraternal Transparency)
        mem_summary_title = page_member.locator('text=Chapter Treasury & Financial Reserves Summary')
        assert mem_summary_title.is_visible(), "Member MUST be able to view Chapter Treasury Summary"
        print("[TEST] Verified Member CAN view Chapter Treasury Summary dashboard (transparency verified).")

        # 2. Member sees Personal Dues Confidentiality Notice
        privacy_notice = page_member.locator('text=Personal Dues History: Members can only see their own contributions and dues below')
        assert privacy_notice.is_visible(), "Member must see confidentiality notice"
        print("[TEST] Verified Member Personal Dues Confidentiality Notice is displayed.")

        # 3. Member Sub-tab says 'My Contributions & Dues'
        my_dues_tab = page_member.locator('#subtab-contributions:has-text("My Contributions & Dues")')
        assert my_dues_tab.is_visible(), "Subtab should specify 'My Contributions & Dues'"
        print("[TEST] Verified subtab label specifies 'My Contributions & Dues'.")

        # 4. Member does NOT see the Officer Scope Toggle
        assert not page_member.locator('#btn-filter-dues-all').is_visible(), "Regular member must NOT see 'All Chapter' scope toggle"
        print("[TEST] Verified Member cannot access 'All Chapter' toggle.")

        page_member.screenshot(path=str(ARTIFACT_DIR / "19_finance_member_personal_dues_view.png"))
        print("[DEBUG] Member Finance Tab Text (Remaining):\n", page_member.locator("main").inner_text()[600:2500])

        # 5. Member ONLY sees their own records and NOT other members' names
        member_dues = page_member.locator("text=E2E Automated Test Monthly Dues").first
        assert member_dues.is_visible(), "Member should see their own personal dues records"
        print("[TEST] Verified Member sees their own personal dues records.")

        # Ensure other members' personal records (e.g., Maria Santos or Juan Dela Cruz individual dues) are NOT displayed
        juan_personal_due = page_member.locator('text=Kuya/Ate Juan Dela Cruz')
        assert not juan_personal_due.is_visible(), "Member MUST NOT see other members' individual contribution lines"
        print("[TEST] Verified Member CANNOT see other members' personal contributions.")

        # Capture Screenshot of Member Finance View (Summary + Personal Dues)
        page_member.screenshot(path=str(ARTIFACT_DIR / "19_finance_member_personal_dues_view.png"))

        # -------------------------------------------------------------
        # TEST 3: SUBMIT CONTRIBUTION MODAL WITH DONATION OPTION
        # -------------------------------------------------------------
        print("\n[TEST] Testing Submit Contribution modal with Donation category...")
        page_member.locator('button:has-text("Submit Dues")').first.click()
        time.sleep(1)

        # Select Special Donation
        page_member.locator('select').first.select_option("Donation")
        time.sleep(0.5)

        # Verify Voluntary Donation notice appears
        donation_notice = page_member.locator('text=Voluntary Fraternal Donation:')
        assert donation_notice.is_visible(), "Voluntary donation fraternal notice should be visible"
        print("[TEST] Verified Voluntary Fraternal Donation notice in modal.")

        page_member.screenshot(path=str(ARTIFACT_DIR / "20_submit_donation_modal.png"))
        
        # Close modal
        page_member.locator('.fixed button:has(svg.lucide-x)').first.click()
        time.sleep(0.5)

        context_member.close()
        browser.close()

    server.shutdown()
    print("\n" + "=" * 80)
    print("ALL FINANCE SUMMARY & MEMBER PRIVACY TESTS PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    main()
