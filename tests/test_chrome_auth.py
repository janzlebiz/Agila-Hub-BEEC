import sys
from playwright.sync_api import sync_playwright

def run():
    print("Launching Google Chrome browser...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # 1. Test Login Page
        print("Navigating to http://localhost:3000/auth/login...")
        sys.stdout.flush()
        page.goto("http://localhost:3000/auth/login", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("h1", timeout=30000)
        print("Login page loaded. Title:", page.title())
        page.screenshot(path="tests/chrome_login_page.png", full_page=True)
        print("SUCCESS: Saved tests/chrome_login_page.png")
        sys.stdout.flush()

        # 2. Test Register Page (Claim Mode)
        print("Navigating to http://localhost:3000/auth/register...")
        sys.stdout.flush()
        page.goto("http://localhost:3000/auth/register", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("h1", timeout=30000)
        page.screenshot(path="tests/chrome_register_claim.png", full_page=True)
        print("SUCCESS: Saved tests/chrome_register_claim.png")
        sys.stdout.flush()

        # 3. Test Register Page (New Applicant Mode)
        applicant_tab = page.locator("button:has-text('New Applicant')")
        if applicant_tab.count() > 0:
            applicant_tab.first.click()
            page.wait_for_timeout(400)
            page.screenshot(path="tests/chrome_register_applicant.png", full_page=True)
            print("SUCCESS: Saved tests/chrome_register_applicant.png")
            sys.stdout.flush()

        # 4. Test Home Page with updated Header
        print("Navigating to http://localhost:3000...")
        sys.stdout.flush()
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("h1", timeout=15000)
        page.screenshot(path="tests/chrome_home_header.png", full_page=True)
        print("SUCCESS: Saved tests/chrome_home_header.png")
        sys.stdout.flush()

        browser.close()
        print("All Google Chrome browser tests completed successfully!")

if __name__ == "__main__":
    run()
