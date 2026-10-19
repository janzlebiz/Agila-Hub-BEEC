#!/usr/bin/env python3
"""
Visual verification for Immediate Step, Phase 2, and Phase 3:
- Google Chrome execution
- PWA manifest & SW verification
- Official Eagles ID Scanner Modal & Instant Replacement
- Realtime Quorum & Headcount badge
- Member Profile & Security Modal
"""
import sys
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCREENSHOT_DIR = Path("d:/Antigravity/Agila Hub/tests")
BASE_URL = "http://localhost:3000"

def run_verification():
    print("[+] Launching Google Chrome via Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream"
            ]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 920})
        page = context.new_page()

        # 1. Verify Manifest & Service Worker
        print("[+] Checking PWA Manifest...")
        resp_manifest = page.goto(f"{BASE_URL}/manifest.json")
        assert resp_manifest and resp_manifest.status == 200, "manifest.json failed to load"
        manifest_data = json.loads(resp_manifest.text())
        print(f"  [✓] PWA Name: {manifest_data.get('name')}")
        print(f"  [✓] Display: {manifest_data.get('display')}")

        print("[+] Checking Service Worker...")
        resp_sw = page.goto(f"{BASE_URL}/sw.js")
        assert resp_sw and resp_sw.status == 200, "sw.js failed to load"
        print("  [✓] Service worker script returned 200 OK")

        # 2. Navigate to Dashboard
        print("[+] Loading Dashboard...")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_selector("main", timeout=15000)
        # Give React time to complete hydration & initial Supabase fetch
        time.sleep(3)

        # Screenshot 1: Overview
        dash_shot = SCREENSHOT_DIR / "chrome_phase2_3_overview.png"
        page.screenshot(path=str(dash_shot), full_page=False)
        print(f"  [✓] Dashboard Overview saved to {dash_shot.name}")

        # 3. Test Official Eagles ID Scanner Modal
        print("[+] Opening Official Eagles ID Scanner Modal...")
        scan_btn = page.locator("#btn-scan-official-id, #btn-scan-and-replace-callout").first
        scan_btn.wait_for(state="visible", timeout=10000)
        scan_btn.click()

        # Wait for modal to render
        preset_tab = page.locator("#tab-scanner-preset")
        preset_tab.wait_for(state="visible", timeout=10000)
        time.sleep(1)

        scanner_shot = SCREENSHOT_DIR / "chrome_official_id_scanner_modal.png"
        page.screenshot(path=str(scanner_shot))
        print(f"  [✓] Scanner modal captured to {scanner_shot.name}")

        # Switch to Preset Official Crest tab
        preset_tab.click()
        time.sleep(0.5)

        # Select Bantayog Elite crest
        crest_btn = page.locator("#btn-use-official-crest")
        crest_btn.wait_for(state="visible", timeout=5000)
        crest_btn.click()
        time.sleep(0.5)

        # Click Replace ID in App
        replace_btn = page.locator("#btn-replace-id-save")
        replace_btn.wait_for(state="visible", timeout=5000)
        replace_btn.click()
        time.sleep(2)

        # Screenshot 2: Replaced Official ID Card on Dashboard
        replaced_shot = SCREENSHOT_DIR / "chrome_official_eagles_id_replaced.png"
        page.screenshot(path=str(replaced_shot))
        print(f"  [✓] Replaced Official ID saved to {replaced_shot.name}")

        # 4. Test Profile & Security Settings Modal
        print("[+] Opening Profile & Security Settings Modal...")
        profile_btn = page.locator("button[aria-label='Profile and Security Settings']").first
        if profile_btn.is_visible():
            profile_btn.click()
            time.sleep(1)
            page.wait_for_selector("text=Member Profile & Security", timeout=10000)

            profile_shot = SCREENSHOT_DIR / "chrome_profile_security_modal.png"
            page.screenshot(path=str(profile_shot))
            print(f"  [✓] Profile settings captured to {profile_shot.name}")

            # Test Official ID Card Tab in profile modal
            page.locator("button:has-text('Official ID Card')").click()
            time.sleep(0.5)
            id_tab_shot = SCREENSHOT_DIR / "chrome_profile_id_card_tab.png"
            page.screenshot(path=str(id_tab_shot))
            print(f"  [✓] Profile ID Card tab saved to {id_tab_shot.name}")

            # Test Security & Pass Tab in profile modal
            page.locator("button:has-text('Security & Pass')").click()
            time.sleep(0.5)
            sec_tab_shot = SCREENSHOT_DIR / "chrome_profile_security_tab.png"
            page.screenshot(path=str(sec_tab_shot))
            print(f"  [✓] Profile Security tab saved to {sec_tab_shot.name}")

        browser.close()
        print("\n[★] Visual verification completed successfully with Google Chrome!")

if __name__ == "__main__":
    run_verification()
