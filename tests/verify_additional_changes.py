#!/usr/bin/env python3
import sys
import time
import socket
import threading
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
    print(f"[TEST] Server serving on {base_url}")

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

        # 2. Login via quick persona button
        pres_btn = page.locator('button[data-persona="president"]')
        if pres_btn.is_visible():
            print("[TEST] Unauthenticated onboarding visible. Logging in as President...")
            pres_btn.click()
            page.wait_for_selector("header", timeout=15000)
            time.sleep(1)

        # 3. Check Profile Button and Header
        header = page.locator("header")
        assert header.is_visible(), "Header should be visible"
        profile_btn = page.locator('button[aria-label="Open Profile and Settings"]')
        assert profile_btn.is_visible(), "Profile button should be visible"
        print("[TEST] Profile button is rendered in Header.")

        # Capture Header screenshot in Light Mode
        page.screenshot(path=str(ARTIFACT_DIR / "11_header_profile_neutral_style.png"))

        # 4. Check Vault Tab and Fraternal Liturgy Section
        print("[TEST] Navigating to Documents / Vault tab...")
        page.locator('button[data-tab="documents"]').click()
        time.sleep(1.5)

        liturgy_section = page.locator('text=Fraternal Liturgy & Fundamental Principles')
        assert liturgy_section.is_visible(), "Fraternal Liturgy section must be visible in Vault"
        print("[TEST] 'Fraternal Liturgy & Fundamental Principles' is visible in Vault.")

        # Check all 5 Liturgy tabs:
        tabs = [
            ("acronym", "Meaning of EAGLES"),
            ("eagleism", "Eagleism"),
            ("prayer", "Ecumenical Prayer"),
            ("hymn", "Eagles Hymn"),
            ("pledge", "Eagles Pledge")
        ]

        for tab_id, tab_label in tabs:
            tab_locator = page.locator(f'button:has-text("{tab_label}")').first
            assert tab_locator.is_visible(), f"Liturgy tab '{tab_label}' should be visible"
            tab_locator.click()
            time.sleep(0.5)
            print(f"[TEST] Clicked liturgy tab: {tab_label}")

        # Capture screenshot of Fraternal Liturgy in Vault
        page.screenshot(path=str(ARTIFACT_DIR / "12_vault_fraternal_liturgy.png"))

        # 5. Check Logout Confirmation from Header
        print("[TEST] Navigating back to Home...")
        page.locator('button[data-tab="home"]').click()
        time.sleep(1)

        print("[TEST] Clicking Log Out in Header...")
        logout_header_btn = page.locator('button[aria-label="Sign Out"]')
        assert logout_header_btn.is_visible(), "Logout button in Header should be visible"
        logout_header_btn.click()
        time.sleep(0.5)

        confirm_dialog = page.locator('text=Confirm Sign Out')
        assert confirm_dialog.is_visible(), "Logout confirmation modal should appear"
        print("[TEST] Logout confirmation dialog is visible after clicking Header logout!")

        # Screenshot of Logout Confirmation Modal
        page.screenshot(path=str(ARTIFACT_DIR / "13_logout_confirmation_modal.png"))

        # Click Cancel
        page.locator('#btn-cancel-logout').click()
        time.sleep(0.5)
        assert not confirm_dialog.is_visible(), "Modal should close on Cancel"
        print("[TEST] Logout confirmation dismissed on Cancel.")

        # Open Profile Settings Modal and verify its Logout button triggers confirmation too
        profile_btn.click()
        time.sleep(1)
        profile_modal = page.locator('text=Member Profile & Security')
        assert profile_modal.is_visible(), "Profile modal should be open"

        # Switch to Security tab inside Profile modal
        page.locator('button:has-text("Security")').click()
        time.sleep(0.5)

        print("[TEST] Clicking Sign Out in Profile Settings Modal...")
        modal_logout_btn = page.locator('text=Sign Out / Log Out of AGILA Hub')
        assert modal_logout_btn.is_visible(), "Logout button inside Profile Modal should be visible"
        modal_logout_btn.click()
        time.sleep(0.5)

        assert confirm_dialog.is_visible(), "Logout confirmation modal should appear from Profile Modal too!"
        print("[TEST] Logout confirmation dialog triggered successfully from Profile Settings Modal!")

        # Confirm Sign Out
        page.locator('#btn-confirm-logout').click()
        time.sleep(1.5)
        print("[TEST] Confirmed Sign Out executed.")

        browser.close()
    server.shutdown()
    print("[TEST] ALL ADDITIONAL CHANGES VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
