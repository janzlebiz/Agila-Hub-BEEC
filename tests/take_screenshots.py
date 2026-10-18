import sys
from playwright.sync_api import sync_playwright

def run():
    print("Launching Edge browser...")
    sys.stdout.flush()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        
        print("Navigating to http://localhost:3000...")
        sys.stdout.flush()
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("h1", timeout=15000)
        print("Page loaded. H1 text:", page.locator("h1").first.inner_text())
        sys.stdout.flush()

        # Capture Light Mode screenshot
        page.screenshot(path="tests/edge_light_mode.png", full_page=True)
        print("SUCCESS: Captured tests/edge_light_mode.png")
        sys.stdout.flush()

        # Switch to Dark Mode
        toggle_btn = page.locator("button[aria-label='Switch to Dark Mode']")
        if toggle_btn.count() > 0:
            toggle_btn.first.click()
            page.wait_for_timeout(600)
            page.screenshot(path="tests/edge_dark_mode.png", full_page=True)
            print("SUCCESS: Captured tests/edge_dark_mode.png")
            sys.stdout.flush()
        else:
            print("Dark mode toggle button not found via aria-label.")

        # Test Text Sizing button
        size_btn = page.locator("button[title*='Text Size']")
        if size_btn.count() > 0:
            size_btn.first.click() # Large 112%
            page.wait_for_timeout(300)
            size_btn.first.click() # XL 125%
            page.wait_for_timeout(300)
            page.screenshot(path="tests/edge_large_text.png", full_page=True)
            print("SUCCESS: Captured tests/edge_large_text.png")
            sys.stdout.flush()

        browser.close()
        print("Done!")

if __name__ == "__main__":
    run()
