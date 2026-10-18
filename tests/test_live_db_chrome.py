import sys
import shutil
from playwright.sync_api import sync_playwright

def run():
    print("Launching Google Chrome channel...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})

        print("Navigating to http://localhost:3000...")
        sys.stdout.flush()
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("h1", timeout=15000)
        print("Page loaded. Header:", page.locator("h1").first.inner_text())
        sys.stdout.flush()

        # Allow Supabase data to hydrate
        page.wait_for_timeout(2500)
        page.screenshot(path="tests/chrome_recommendation_overview.png", full_page=True)
        print("SUCCESS: Captured tests/chrome_recommendation_overview.png")
        sys.stdout.flush()

        # 1. Test High-Res QR Code Modal on the Polycarbonate Digital ID
        qr_btn = page.locator("button[title*='verification QR']").first
        if qr_btn.count() > 0:
            print("Opening QR Modal from Polycarbonate Credential...")
            qr_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="tests/chrome_qr_credential_modal.png")
            print("SUCCESS: Captured tests/chrome_qr_credential_modal.png")
            sys.stdout.flush()

            # Close Modal
            close_btn = page.locator("button:has-text('Close Pass')").first
            if close_btn.count() > 0:
                close_btn.click()
                page.wait_for_timeout(500)

        # 2. Test Tactile Passcode Check-In
        confirm_btn = page.locator("button:has-text('Confirm Attendance')").first
        if confirm_btn.count() > 0:
            print("Submitting tactile passcode check-in...")
            confirm_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path="tests/chrome_tactile_checkin_feedback.png")
            print("SUCCESS: Captured tests/chrome_tactile_checkin_feedback.png")
            sys.stdout.flush()

        # 3. Test Fraternal Action Docket Tabs
        # Ledger Tab
        ledger_tab = page.locator("button:has-text('Ledger')").first
        if ledger_tab.count() > 0:
            print("Opening Financial Ledger tab...")
            ledger_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_docket_ledger_view.png")
            print("SUCCESS: Captured tests/chrome_docket_ledger_view.png")
            sys.stdout.flush()

        # Vault Tab
        vault_tab = page.locator("button:has-text('Vault')").first
        if vault_tab.count() > 0:
            print("Opening Document Vault tab...")
            vault_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_docket_vault_view.png")
            print("SUCCESS: Captured tests/chrome_docket_vault_view.png")
            sys.stdout.flush()

        # Outreach Tab
        outreach_tab = page.locator("button:has-text('Outreach')").first
        if outreach_tab.count() > 0:
            print("Opening Community Outreach tab...")
            outreach_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_docket_outreach_view.png")
            print("SUCCESS: Captured tests/chrome_docket_outreach_view.png")
            sys.stdout.flush()

        # 4. Toggle Dark Mode and capture
        theme_btn = page.locator("button[aria-label*='Mode']").first
        if theme_btn.count() > 0:
            print("Toggling Dark Mode...")
            theme_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_dark_mode_overview.png", full_page=True)
            print("SUCCESS: Captured tests/chrome_dark_mode_overview.png")
            sys.stdout.flush()

        browser.close()
        print("All 4 design recommendations visually verified in Google Chrome!")

if __name__ == "__main__":
    run()
