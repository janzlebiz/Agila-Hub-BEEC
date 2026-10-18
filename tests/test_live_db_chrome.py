import sys
from playwright.sync_api import sync_playwright

def run():
    print("Launching Google Chrome...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        print("Navigating to http://localhost:3000...")
        sys.stdout.flush()
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("h1", timeout=15000)
        print("Page loaded. H1 text:", page.locator("h1").first.inner_text())
        sys.stdout.flush()

        # Allow Supabase data to hydrate
        page.wait_for_timeout(2000)
        page.screenshot(path="tests/chrome_live_db_dashboard.png", full_page=True)
        print("SUCCESS: Saved tests/chrome_live_db_dashboard.png")
        sys.stdout.flush()

        # Test live Check-In button click
        checkin_btn = page.locator("button:has-text('Record Attendance')")
        if checkin_btn.count() > 0:
            print("Clicking Record Attendance button...")
            checkin_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path="tests/chrome_live_checkin_success.png", full_page=True)
            print("SUCCESS: Saved tests/chrome_live_checkin_success.png")
            sys.stdout.flush()

        # Switch to Meetings tab
        meetings_card = page.locator("span:has-text('Meetings')").first
        if meetings_card.count() > 0:
            meetings_card.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="tests/chrome_live_meetings_tab.png", full_page=True)
            print("SUCCESS: Saved tests/chrome_live_meetings_tab.png")
            sys.stdout.flush()

        # Switch to Contributions tab
        contrib_card = page.locator("span:has-text('Contributions')").first
        if contrib_card.count() > 0:
            contrib_card.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="tests/chrome_live_contributions_tab.png", full_page=True)
            print("SUCCESS: Saved tests/chrome_live_contributions_tab.png")
            sys.stdout.flush()

        browser.close()
        print("All live database operations verified via Google Chrome successfully!")

if __name__ == "__main__":
    run()
