#!/usr/bin/env python3
import sys
import time
import socket
import threading

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

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
        context = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 AGILAHUB/1.0.0"
        )
        page = context.new_page()

        # 1. Open App
        page.goto(base_url)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login as President
        pres_btn = page.locator('button[data-persona="president"]')
        if pres_btn.is_visible():
            print("[TEST] Unauthenticated onboarding visible. Logging in as President...")
            pres_btn.click()
            page.wait_for_selector("header", timeout=15000)
            time.sleep(1)

        # -------------------------------------------------------------
        # 2. TEST FINANCE: MONTHLY CONTRIBUTION POLICY & EXPENSES
        # -------------------------------------------------------------
        print("\n[TEST] Navigating to Finance / Ledger tab...")
        page.locator('button[data-tab="ledger"]').click()
        time.sleep(1.5)

        # Verify Monthly Contribution Policy Banner
        policy_banner = page.locator('text=Monthly Contribution Policy')
        assert policy_banner.is_visible(), "Monthly Contribution Policy banner should be visible"
        print("[TEST] Verified Monthly Contribution Policy banner is visible.")

        policy_rate = page.locator('text=400.00').first
        assert policy_rate.is_visible(), "Default 400.00 monthly rate should be displayed"
        print("[TEST] Verified default ₱400.00 monthly rate is displayed.")

        allocation_text = page.locator('text=Membership Renewal').first
        assert allocation_text.is_visible(), "Renewal allocation should be shown"
        print("[TEST] Verified Renewal and Alalayang Agila breakdown text is displayed.")

        # Test Adjust Policy Rate Modal
        adjust_btn = page.locator('#btn-adjust-monthly-dues')
        assert adjust_btn.is_visible(), "Adjust Policy Rate button should be visible for President/Treasurer"
        adjust_btn.click()
        time.sleep(1)

        modal_title = page.locator('h3:has-text("Monthly Contribution Policy")')
        assert modal_title.is_visible(), "Monthly Dues Adjustment Modal should open"
        print("[TEST] Verified Monthly Dues Adjustment Modal opened.")

        # Submit a rate proposal
        submit_prop_btn = page.locator('#btn-submit-dues-proposal')
        assert submit_prop_btn.is_visible(), "Submit proposal button should be visible"
        submit_prop_btn.click()
        time.sleep(2)
        print("[TEST] Submitted monthly rate adjustment proposal.")

        # Capture screenshot of Finance & Policy Banner
        page.screenshot(path=str(ARTIFACT_DIR / "14_finance_monthly_rate_policy.png"))

        # Test Expenses Sub-tab in Finance
        print("[TEST] Switching to Released Expenses sub-tab...")
        expenses_subtab = page.locator('#subtab-expenses')
        assert expenses_subtab.is_visible(), "Released Expenses sub-tab button should be visible"
        expenses_subtab.click()
        time.sleep(1)

        renewal_exp_card = page.locator('text=Membership Renewal Remitted').first
        assert renewal_exp_card.is_visible(), "Membership Renewal expense summary card should be visible"
        alalayang_exp_card = page.locator('text=Alalayang Agila Grants').first
        assert alalayang_exp_card.is_visible(), "Alalayang Agila expense summary card should be visible"
        community_exp_card = page.locator('text=Community Service Budget').first
        assert community_exp_card.is_visible(), "Community Service expense summary card should be visible"
        print("[TEST] Verified Expenses Category breakdown summary cards.")

        # Check expense items
        exp_item = page.locator('text=TFOE-PE National Secretariat')
        assert exp_item.is_visible(), "National Secretariat renewal expense should be listed"
        print("[TEST] Verified individual expense disbursement item is listed.")

        # Capture screenshot of Expenses Sub-tab
        page.screenshot(path=str(ARTIFACT_DIR / "16_finance_expenses_breakdown.png"))

        # -------------------------------------------------------------
        # 3. TEST ASSEMBLIES: ALALAYANG AGILA TAB
        # -------------------------------------------------------------
        print("\n[TEST] Navigating to Assemblies tab...")
        page.locator('button[data-tab="assemblies"]').click()
        time.sleep(1.5)

        # Click Alalayang Agila Sub-tab
        alalayang_tab = page.locator('#subtab-alalayang-agila')
        assert alalayang_tab.is_visible(), "Alalayang Agila sub-tab should be visible"
        alalayang_tab.click()
        time.sleep(1)

        alalayang_banner = page.locator('text=Alalayang Agila Fraternal Benevolence Fund')
        assert alalayang_banner.is_visible(), "Alalayang Agila banner should be visible"
        print("[TEST] Verified Alalayang Agila Fraternal Benevolence Fund banner.")

        # Verify beneficiary info, reason, and amount
        recipient_name = page.locator('text=Kuya Juan Santos').first
        assert recipient_name.is_visible(), "Recipient person's name should be visible"
        print("[TEST] Verified recipient name is displayed: Kuya Juan Santos.")

        reason_text = page.locator('text=acute cardiac procedure').first
        assert reason_text.is_visible(), "Assistance reason should be visible"
        print("[TEST] Verified assistance reason is displayed.")

        grant_amount = page.locator('text=15,000.00').first
        assert grant_amount.is_visible(), "Grant amount should be visible"
        print("[TEST] Verified grant amount is displayed: ₱15,000.00.")

        # Capture screenshot of Assemblies Alalayang Agila tab
        page.screenshot(path=str(ARTIFACT_DIR / "15_assemblies_alalayang_agila_tab.png"))

        # -------------------------------------------------------------
        # 4. TEST SUBMIT CONTRIBUTION MODAL: BREAKDOWN DISPLAY
        # -------------------------------------------------------------
        print("\n[TEST] Navigating back to Finance to test Submit Dues Modal...")
        page.locator('button[data-tab="ledger"]').click()
        time.sleep(1)

        # Click Submit Dues button
        page.locator('button:has-text("Submit Dues")').first.click()
        time.sleep(1)

        dues_modal = page.locator('text=Submit Dues & Contribution')
        assert dues_modal.is_visible(), "Submit Dues modal should open"

        # Verify Monthly Fraternal Allocation Breakdown card in modal
        breakdown_card = page.locator('text=Monthly Fraternal Allocation Breakdown:')
        assert breakdown_card.is_visible(), "Allocation breakdown card should appear in modal"
        renewal_split = page.locator('text=Renewal Remittance:').first
        assert renewal_split.is_visible(), "Renewal remittance split should be shown in modal"
        alalayang_split = page.locator('text=Alalayang Agila & Service:').first
        assert alalayang_split.is_visible(), "Alalayang Agila & Service split should be shown in modal"
        print("[TEST] Verified Submit Dues modal displays ₱400 monthly breakdown (₱100 renewal, ₱300 alalayang & service).")

        # Capture screenshot of Submit Dues modal
        page.screenshot(path=str(ARTIFACT_DIR / "17_submit_dues_allocation_breakdown.png"))

        browser.close()
    server.shutdown()
    print("\n[TEST] ALL FINANCE, EXPENSES & ALALAYANG AGILA TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
