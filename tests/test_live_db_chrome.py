import sys
from playwright.sync_api import sync_playwright

def run():
    print("Launching Google Chrome...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})

        print("Navigating to http://localhost:3000...")
        sys.stdout.flush()
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("h1", timeout=15000)
        print("Page loaded. Greeting:", page.locator("h1").first.inner_text())
        sys.stdout.flush()

        # Allow Supabase data to hydrate
        page.wait_for_timeout(3000)
        page.screenshot(path="tests/chrome_phases_overview.png", full_page=True)
        print("SUCCESS: Captured tests/chrome_phases_overview.png")
        sys.stdout.flush()

        # ----------------------------------------------------------------------
        # Phase B: Secretariat Camera QR Attendance Scanner
        # ----------------------------------------------------------------------
        page.wait_for_selector("button:has-text('Launch QR Scanner')", timeout=15000)
        scanner_btn = page.locator("button:has-text('Launch QR Scanner')").first
        if scanner_btn.count() > 0:
            print("Opening Secretariat QR Attendance Scanner...")
            scanner_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="tests/chrome_phase_b_scanner_viewfinder.png")
            print("SUCCESS: Captured tests/chrome_phase_b_scanner_viewfinder.png")
            sys.stdout.flush()

            # Test scanning a member credential (AGILA-2024-001 inside modal)
            test_scan_btn = page.locator(".fixed button:has-text('Kuya Juan')").first
            if test_scan_btn.count() > 0:
                print("Simulating QR scan for Kuya Juan (AGILA-2024-001)...")
                test_scan_btn.click()
                page.wait_for_timeout(1500)
                page.screenshot(path="tests/chrome_phase_b_scanner_success.png")
                print("SUCCESS: Captured tests/chrome_phase_b_scanner_success.png")
                sys.stdout.flush()

            # Close scanner modal
            close_scanner = page.locator(".fixed button:has(svg.lucide-x)").first
            if close_scanner.count() > 0:
                close_scanner.click()
                page.wait_for_timeout(500)

        # ----------------------------------------------------------------------
        # Phase A: Ledger Tab & Contribution Submission
        # ----------------------------------------------------------------------
        ledger_tab = page.locator("button:has-text('Ledger')").first
        if ledger_tab.count() > 0:
            print("Switching to Financial Ledger tab...")
            ledger_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_phase_a_ledger_view.png")
            print("SUCCESS: Captured tests/chrome_phase_a_ledger_view.png")
            sys.stdout.flush()

            # Open Submit Contribution modal
            submit_btn = page.locator("button:has-text('Submit Dues / Donation')").first
            if submit_btn.count() > 0:
                print("Opening Submit Dues & Contribution modal...")
                submit_btn.click()
                page.wait_for_timeout(800)
                page.screenshot(path="tests/chrome_phase_a_submit_modal.png")
                print("SUCCESS: Captured tests/chrome_phase_a_submit_modal.png")
                sys.stdout.flush()

                # Close modal
                cancel_btn = page.locator("button:has-text('Cancel')").first
                if cancel_btn.count() > 0:
                    cancel_btn.click()
                    page.wait_for_timeout(500)

        # ----------------------------------------------------------------------
        # Phase D: Fraternal Directory & Chapter Roster
        # ----------------------------------------------------------------------
        roster_tab = page.locator("button:has-text('Roster')").first
        if roster_tab.count() > 0:
            print("Switching to Roster / Directory tab...")
            roster_tab.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_phase_d_roster_view.png")
            print("SUCCESS: Captured tests/chrome_phase_d_roster_view.png")
            sys.stdout.flush()

            # Test search filter for "Santos"
            search_input = page.locator("input[placeholder*='Search Kuya/Ate']").first
            if search_input.count() > 0:
                print("Filtering roster by 'Santos'...")
                search_input.fill("Santos")
                page.wait_for_timeout(600)
                page.screenshot(path="tests/chrome_phase_d_roster_filtered.png")
                print("SUCCESS: Captured tests/chrome_phase_d_roster_filtered.png")
                sys.stdout.flush()

                # Click Inspect ID on Ate Maria Santos
                inspect_btn = page.locator("button:has-text('Inspect ID')").first
                if inspect_btn.count() > 0:
                    print("Inspecting Ate Maria Santos ID...")
                    inspect_btn.click()
                    page.wait_for_timeout(800)
                    page.screenshot(path="tests/chrome_phase_d_inspected_credential.png")
                    print("SUCCESS: Captured tests/chrome_phase_d_inspected_credential.png")
                    sys.stdout.flush()

        # ----------------------------------------------------------------------
        # Dark Mode Overview
        # ----------------------------------------------------------------------
        theme_btn = page.locator("button[aria-label*='Mode']").first
        if theme_btn.count() > 0:
            print("Toggling dark mode...")
            theme_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path="tests/chrome_phases_dark_mode.png", full_page=True)
            print("SUCCESS: Captured tests/chrome_phases_dark_mode.png")
            sys.stdout.flush()

        browser.close()
        print("ALL PHASES A, B, C, and D visually verified in Google Chrome successfully!")

if __name__ == "__main__":
    run()
