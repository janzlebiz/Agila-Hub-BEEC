import os
import sys
import time
from playwright.sync_api import sync_playwright

os.makedirs("tests/e2e_evidence", exist_ok=True)

def capture_all():
    print("Launching browser with Playwright...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 412, "height": 915}) # Mobile viewport matching Android
        page = context.new_page()

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1000)

        # Login as President demo persona to access all features
        pres_btn = page.locator("button:has-text('President')").first
        if pres_btn.count() > 0:
            print("Logging in as President...")
            pres_btn.click()
            page.wait_for_timeout(2000)

        # 1. Home Dashboard & Digital ID
        print("1. Capturing Home Dashboard & Digital ID...")
        page.wait_for_timeout(1000)
        page.screenshot(path="tests/e2e_evidence/01_home_dashboard.png")

        # 2. Assemblies Screen
        print("2. Navigating to Assemblies...")
        assemblies_btn = page.locator("button[data-tab='assemblies']").first
        assemblies_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="tests/e2e_evidence/02_assemblies_screen.png")

        # Check Manual Attendance Modal
        check_att_btn = page.locator("#btn-manual-attendance, button:has-text('Check Attendance')").first
        if check_att_btn.count() > 0:
            print("2b. Opening Manual Attendance Modal...")
            check_att_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/e2e_evidence/02b_assemblies_manual_attendance_modal.png")
            # Close modal
            close_btn = page.locator("button:has-text('Cancel')").first
            if close_btn.count() > 0:
                close_btn.click()
                page.wait_for_timeout(500)

        # 3. Finance Screen (Default Reserves - Policy Banner Hidden)
        print("3. Navigating to Finance...")
        finance_btn = page.locator("button[data-tab='ledger']").first
        finance_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="tests/e2e_evidence/03a_finance_screen_reserves.png")

        # 3b. Finance Screen (Dues Selected - Policy Banner Visible)
        print("3b. Selecting Contributions & Dues card...")
        dues_card = page.locator("#subtab-contributions, button:has-text('Contributions & Dues')").first
        if dues_card.count() > 0:
            dues_card.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/e2e_evidence/03b_finance_screen_dues.png")

        # 4. Directory Screen - Club Officers
        print("4. Navigating to Directory...")
        directory_btn = page.locator("button[data-tab='directory']").first
        directory_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="tests/e2e_evidence/04a_directory_screen_officers.png")

        # 4b. Officer Detail Modal
        officer_row = page.locator("button:has-text('JOY M. ARAGON')").first
        if officer_row.count() > 0:
            print("4b. Opening Officer Detail Modal...")
            officer_row.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/e2e_evidence/04b_directory_officer_modal.png")
            # Close modal
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)

        # 4c. Directory Screen - Club Members (Filters removed)
        print("4c. Selecting Club Members tab...")
        members_tab = page.locator("#roster-tab-members, button:has-text('Club Members')").first
        if members_tab.count() > 0:
            members_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/e2e_evidence/04c_directory_screen_members.png")

        # 5. Vault Screen
        print("5. Navigating to Document Vault...")
        vault_btn = page.locator("button[data-tab='documents']").first
        vault_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="tests/e2e_evidence/05a_vault_screen.png")

        # 5b. Vault Screen - Eagles Hymn
        print("5b. Opening Eagles Hymn in Fraternal Liturgy...")
        hymn_tab = page.locator("button:has-text('Eagles Hymn')").first
        if hymn_tab.count() > 0:
            hymn_tab.scroll_into_view_if_needed()
            page.wait_for_timeout(400)
            hymn_tab.click()
            page.wait_for_timeout(600)
            page.screenshot(path="tests/e2e_evidence/05b_vault_eagles_hymn.png")

        # 5c. Vault Screen - Read Full Text Modal (TFOE-PE Logo on white)
        print("5c. Opening Read Full Text Modal...")
        # Scroll back up to Magna Carta card
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(400)
        read_full_btn = page.locator("button:has-text('Read Full Text')").first
        if read_full_btn.count() > 0:
            read_full_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="tests/e2e_evidence/05c_vault_magna_carta_modal.png")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

        browser.close()
        print("ALL VISUAL EVIDENCE CAPTURED SUCCESSFULLY!")

if __name__ == "__main__":
    capture_all()
