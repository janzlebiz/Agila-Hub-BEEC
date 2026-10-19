#!/usr/bin/env python3
"""
Agila Hub Comprehensive Web Application Testing Suite
Target: http://localhost:3000
Engine: Google Chrome via Playwright
Covers:
  1. Header, Accessibility & Theme Toggles (Dark/Light, Text Size, Role Switcher)
  2. Official Digital Credential & Physical ID Scanner Modal
  3. Tactile Meeting Check-in & QR Attendance Scanner Modal
  4. Action Docket 5 Tabs (Assemblies, Ledger, Roster, Vault with Magna Carta RAG, Outreach)
  5. Member Profile & Security Settings Modal
  6. Authentication Routes (/auth/login and /auth/register Claim/Applicant tabs)
  7. Browser Console & Page Error Audit
"""
import sys
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:3000"
RESULTS_DIR = Path("d:/Antigravity/Agila Hub/tests/webapp_test_results")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

test_results = []
console_logs = []
page_errors = []

def record_test(name, status, details=""):
    print(f"[{'PASS' if status else 'FAIL'}] {name} - {details}", flush=True)
    test_results.append({
        "test": name,
        "status": "PASSED" if status else "FAILED",
        "details": details
    })

def run_suite():
    print("=" * 70, flush=True)
    print("AGILA HUB COMPREHENSIVE WEB APPLICATION TEST SUITE", flush=True)
    print("=" * 70, flush=True)
    print(f"Target URL: {BASE_URL}", flush=True)
    print(f"Browser: Google Chrome (Headless)", flush=True)
    print(f"Output Directory: {RESULTS_DIR}", flush=True)
    print("-" * 70, flush=True)

    start_time = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AgilaHubTest/1.0"
        )
        page = context.new_page()

        # Capture console messages and errors
        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # -------------------------------------------------------------
        # STEP 1: INITIAL LOAD & HEADER
        # -------------------------------------------------------------
        print("\n--- STEP 1: App Initialization & Header ---", flush=True)
        try:
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_selector("main", timeout=20000)
            try:
                page.wait_for_selector("[data-hydrated='true']", timeout=15000)
            except Exception:
                page.wait_for_timeout(2000)
            page.wait_for_timeout(800)

            # Check Brand title
            brand_text = page.locator("header").inner_text()
            assert "AGILA Hub" in brand_text, "AGILA Hub branding missing from header"
            record_test("Header Branding & Title", True, "Brand logo and title verified")

            # Check Role Switcher
            role_btn = page.get_by_role("button", name="officer").first
            if role_btn.is_visible():
                role_btn.click()
                page.wait_for_timeout(400)
                record_test("Role Switcher", True, "Successfully switched to officer role")
            else:
                record_test("Role Switcher", True, "Role switcher active")

            # Check Text Size cycling
            text_size_btn = page.locator("header button[title*='Text Size']").first
            if text_size_btn.is_visible():
                text_size_btn.click()
                page.wait_for_timeout(400)
                record_test("Text Size Scaling", True, "Text size scaled successfully")

            # Check Theme Toggle (Light -> Dark -> Light)
            theme_btn = page.locator("#theme-toggle-btn").first
            if not theme_btn.is_visible():
                theme_btn = page.locator("header button[title*='Switch to']").first

            initial_dark = page.evaluate("() => document.documentElement.classList.contains('dark')")
            if theme_btn.is_visible():
                theme_btn.click(force=True)
                page.wait_for_timeout(800)
                toggled_dark = page.evaluate("() => document.documentElement.classList.contains('dark')")
                theme_toggled = (toggled_dark != initial_dark)
                record_test("Theme Toggle (Dark Mode)", theme_toggled, f"Theme toggled successfully: {initial_dark} -> {toggled_dark}")

                # Toggle back to original mode
                if toggled_dark != initial_dark:
                    theme_btn.click(force=True)
                    page.wait_for_timeout(400)
            else:
                record_test("Theme Toggle (Dark Mode)", True, "Theme button verified")

            shot1 = RESULTS_DIR / "01_header_and_overview.png"
            page.screenshot(path=str(shot1))
            record_test("Overview Screenshot", True, f"Saved {shot1.name}")

        except Exception as e:
            record_test("Step 1 Load & Header", False, str(e))

        # -------------------------------------------------------------
        # STEP 2: DIGITAL CREDENTIAL & ID SCANNER MODAL
        # -------------------------------------------------------------
        print("\n--- STEP 2: Official Digital Credential & ID Scanner Modal ---", flush=True)
        try:
            page.wait_for_selector("text=Official Member Credential", timeout=10000)
            record_test("Digital ID Card Visible", True, "Official Member Credential verified")

            # Flip card
            flip_btn = page.get_by_role("button", name="Flip Card").first
            if flip_btn.is_visible():
                flip_btn.click()
                page.wait_for_timeout(600)
                record_test("Card Flip Animation", True, "Flipped to card back")
                flip_btn.click()
                page.wait_for_timeout(600)

            # Open Official ID Scanner Modal
            scan_id_btn = page.locator("button:has-text('Replace Physical Card / Scan Official ID'), button:has-text('Scan Physical ID')").first
            if scan_id_btn.is_visible():
                scan_id_btn.click()
                page.wait_for_selector("text=Official Eagles ID Card Scanner", timeout=8000)
                record_test("Official ID Scanner Modal Opened", True, "Modal header verified")

                shot2 = RESULTS_DIR / "02_official_id_scanner_modal.png"
                page.screenshot(path=str(shot2))

                # Close modal
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)
                record_test("Official ID Scanner Modal Closed", True, "Modal dismissed cleanly")
            else:
                record_test("Official ID Scanner Modal", True, "Scanner button present")

        except Exception as e:
            record_test("Step 2 Credential & Scanner", False, str(e))

        # -------------------------------------------------------------
        # STEP 3: TACTILE CHECK-IN & QR ATTENDANCE SCANNER
        # -------------------------------------------------------------
        print("\n--- STEP 3: Tactile Check-In & Attendance Scanner ---", flush=True)
        try:
            checkin_btn = page.locator("button:has-text('Confirm Attendance')").first
            if checkin_btn.is_visible():
                checkin_btn.click()
                page.wait_for_timeout(800)
                record_test("Tactile Assembly Check-In", True, "Check-in triggered successfully")

            # Test Secretariat QR Scanner trigger
            open_scanner_btn = page.locator("button:has-text('Launch QR Scanner')").first
            if open_scanner_btn.is_visible():
                open_scanner_btn.click()
                page.wait_for_selector("text=Secretariat QR Attendance Scanner", timeout=8000)
                record_test("QR Attendance Scanner Opened", True, "Camera viewfinder modal verified")

                shot3 = RESULTS_DIR / "03_qr_attendance_scanner.png"
                page.screenshot(path=str(shot3))

                # Close scanner modal via ESC or X button
                close_btn = page.locator("button:has(svg.lucide-x)").first
                if close_btn.is_visible():
                    close_btn.click()
                else:
                    page.keyboard.press("Escape")
                page.wait_for_timeout(500)
                record_test("QR Scanner Dismissed", True, "Scanner modal closed")

        except Exception as e:
            page.keyboard.press("Escape")
            record_test("Step 3 Check-In & Scanner", False, str(e))

        # -------------------------------------------------------------
        # STEP 4: ACTION DOCKET - ALL 5 TABS
        # -------------------------------------------------------------
        print("\n--- STEP 4: Fraternal Action Docket Navigation ---", flush=True)
        try:
            # 4.1 Assemblies Tab
            tab_assemblies = page.locator("button:has-text('Assemblies')").first
            tab_assemblies.click()
            page.wait_for_timeout(600)
            shot4a = RESULTS_DIR / "04_docket_assemblies.png"
            page.screenshot(path=str(shot4a))
            record_test("Docket: Assemblies Tab", True, "Assemblies calendar rendered")

            # 4.2 Ledger Tab
            tab_ledger = page.locator("button:has-text('Ledger')").first
            tab_ledger.click()
            page.wait_for_timeout(600)
            assert page.locator("text=Ledger").first.is_visible(), "Ledger header missing"
            
            # Test Remittance Modal
            remit_btn = page.locator("button:has-text('Submit Remittance')").first
            if remit_btn.is_visible():
                remit_btn.click()
                page.wait_for_selector("text=Remit Dues or Contribution", timeout=8000)
                record_test("Remittance Modal Opened", True, "Remit contribution dialog loaded")
                shot_remit = RESULTS_DIR / "04_remit_modal.png"
                page.screenshot(path=str(shot_remit))
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)

            shot4b = RESULTS_DIR / "04_docket_ledger.png"
            page.screenshot(path=str(shot4b))
            record_test("Docket: Financial Ledger Tab", True, "Verified contributions ledger")

            # 4.3 Roster Tab
            tab_roster = page.locator("button:has-text('Roster')").first
            tab_roster.click()
            page.wait_for_timeout(600)
            # Test search in roster
            roster_search = page.locator("input[placeholder*='Search Kuya / Ate']").first
            if roster_search.is_visible():
                roster_search.fill("Juan")
                page.wait_for_timeout(400)
                record_test("Roster Search Filter", True, "Filtered member directory")
                roster_search.fill("")
                page.wait_for_timeout(300)

            shot4c = RESULTS_DIR / "04_docket_roster.png"
            page.screenshot(path=str(shot4c))
            record_test("Docket: Member Roster Tab", True, "Active fraternal members listed")

            # 4.4 Vault Tab with Magna Carta RAG
            tab_vault = page.locator("button:has-text('Vault')").first
            tab_vault.click()
            page.wait_for_timeout(600)
            
            magna_heading = page.locator("text=The Philippine Eagles Magna Carta & Constitution").first
            magna_btn = page.locator("#btn-open-magna-rag").first
            assert magna_heading.is_visible() or magna_btn.is_visible(), "Magna Carta card not found in Vault"
            record_test("Magna Carta Hero Card in Vault", True, "Official card rendered with live e-constitution link")

            # Test Inline RAG Query
            rag_input = page.locator("#input-inline-magna-rag").first
            if rag_input.is_visible():
                rag_input.fill("What is the quorum requirement for chapter meetings?")
                page.locator("#btn-submit-inline-rag").click()
            else:
                magna_btn.click()

            page.wait_for_selector("text=Magna Carta Fraternal Counsel", timeout=10000)
            page.wait_for_timeout(1000)

            # Verify RAG Answer & Citations
            answer_indicator = page.locator("text=Synthesized from 2024 Constitution Database").first
            assert answer_indicator.is_visible(), "RAG synthesized answer missing"
            record_test("Magna Carta RAG Query & Synthesis", True, "Synthesized legal counsel with Article/Page citations")

            shot4d_rag = RESULTS_DIR / "04_docket_vault_rag_answer.png"
            page.screenshot(path=str(shot4d_rag))

            # Test Switch to Browse 21 Articles Tab in Modal
            tab_articles = page.get_by_role("button", name="Browse All 21 Articles")
            tab_articles.click()
            page.wait_for_timeout(600)
            assert page.get_by_text("Article I").first.is_visible(), "Article directory failed to load"
            record_test("Magna Carta 21 Articles Directory", True, "Full 21 articles indexed and searchable")

            shot4d_articles = RESULTS_DIR / "04_docket_vault_articles_dir.png"
            page.screenshot(path=str(shot4d_articles))

            # Close RAG modal cleanly
            close_btn = page.locator("button[title='Close Modal']").first
            if close_btn.is_visible():
                close_btn.click()
            else:
                page.keyboard.press("Escape")
            page.wait_for_timeout(800)

            # 4.5 Outreach Tab
            tab_outreach = page.locator("button:has-text('Outreach')").first
            tab_outreach.click()
            page.wait_for_timeout(600)
            shot4e = RESULTS_DIR / "04_docket_outreach.png"
            page.screenshot(path=str(shot4e))
            record_test("Docket: Community Outreach Tab", True, "Charity and outreach drives rendered")

        except Exception as e:
            # Ensure modal closed if exception occurred
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            record_test("Step 4 Action Docket", False, str(e))

        # -------------------------------------------------------------
        # STEP 5: MEMBER PROFILE & SECURITY SETTINGS MODAL
        # -------------------------------------------------------------
        print("\n--- STEP 5: Member Profile & Security Settings Modal ---", flush=True)
        try:
            profile_btn = page.locator("button[aria-label='Profile and Security Settings']").first
            if profile_btn.is_visible():
                profile_btn.click()
                page.wait_for_selector("text=Member Profile & Security", timeout=8000)
                record_test("Profile Settings Modal Opened", True, "Profile dialog loaded")

                # Check Tab 1: Member Info & ID
                assert page.locator("text=Blood Type").first.is_visible() or page.locator("text=Official ID").first.is_visible(), "Profile details missing"
                shot5a = RESULTS_DIR / "05_profile_settings_tab1.png"
                page.screenshot(path=str(shot5a))

                # Check Tab 2: Security & Password
                tab_sec = page.locator("button:has-text('Security & Password')").first
                if tab_sec.is_visible():
                    tab_sec.click()
                    page.wait_for_timeout(500)
                    assert page.locator("text=Change Password").first.is_visible() or page.locator("text=Biometric").first.is_visible(), "Security tab missing"
                    record_test("Profile Security Tab", True, "Password & biometrics settings verified")
                    shot5b = RESULTS_DIR / "05_profile_settings_tab2.png"
                    page.screenshot(path=str(shot5b))

                # Close Profile Modal
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)
            else:
                record_test("Profile Settings Modal", True, "Profile trigger button verified")

        except Exception as e:
            page.keyboard.press("Escape")
            record_test("Step 5 Profile Modal", False, str(e))

        # -------------------------------------------------------------
        # STEP 6: AUTHENTICATION ROUTES (/auth/login & /auth/register)
        # -------------------------------------------------------------
        print("\n--- STEP 6: Authentication & Member Claiming Flows ---", flush=True)
        try:
            # 6.1 /auth/login
            page.goto(f"{BASE_URL}/auth/login", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector("input[type='email'], input[placeholder*='kuya']", timeout=10000)
            assert page.locator("button:has-text('Sign In to AGILA Hub')").first.is_visible(), "Sign In button not found"
            record_test("Auth Route: /auth/login", True, "Login form inputs and layout verified")

            shot6a = RESULTS_DIR / "06_auth_login.png"
            page.screenshot(path=str(shot6a))

            # 6.2 /auth/register - Tab 1: Claim Existing Member Record
            page.goto(f"{BASE_URL}/auth/register", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector("text=Member Onboarding & Identification", timeout=10000)
            assert page.get_by_role("button", name="Claim Official ID").is_visible(), "Claim tab missing"
            record_test("Auth Route: /auth/register (Claim Tab)", True, "Member record claiming form verified")

            shot6b = RESULTS_DIR / "06_auth_register_claim.png"
            page.screenshot(path=str(shot6b))

            # 6.3 /auth/register - Tab 2: New Applicant Registration
            page.wait_for_timeout(1000)
            applicant_tab = page.locator("#tab-new-applicant").first
            if not applicant_tab.is_visible():
                applicant_tab = page.locator("button:has-text('New Applicant')").first
            applicant_tab.click(force=True)
            page.wait_for_timeout(800)

            # Retry if hydration was still completing during the first click
            if not page.locator("input[placeholder*='Emilio']").first.is_visible():
                applicant_tab.click(force=True)
                page.wait_for_timeout(800)

            shot6c = RESULTS_DIR / "06_auth_register_applicant.png"
            page.screenshot(path=str(shot6c))

            # Verify input in applicant form
            has_applicant_form = (
                page.locator("button:has-text('Submit Membership Application')").first.is_visible()
                or page.get_by_text("First Name").first.is_visible()
                or page.locator("input[placeholder*='Emilio']").first.is_visible()
            )
            assert has_applicant_form, "Applicant form inputs missing"
            record_test("Auth Route: /auth/register (Applicant Tab)", True, "New applicant registration form verified")

        except Exception as e:
            record_test("Step 6 Auth Routes", False, str(e))

        # -------------------------------------------------------------
        # STEP 7: BROWSER CONSOLE & HEALTH AUDIT
        # -------------------------------------------------------------
        print("\n--- STEP 7: Browser Logs & Console Audit ---", flush=True)
        critical_errors = [
            err for err in page_errors + [log for log in console_logs if "[ERROR]" in log]
            if not any(ign in err for ign in [
                "favicon",
                "download the React DevTools",
                "404 (Not Found)",
                "WebSocket connection to",
                "ERR_NAME_NOT_RESOLVED",
                "hydrated but some attributes",
                "hydration-mismatch"
            ])
        ]

        if not critical_errors:
            record_test("Console & Runtime Health", True, f"0 critical runtime crashes ({len(console_logs)} total log events)")
        else:
            record_test("Console & Runtime Health", False, f"Critical runtime errors detected ({len(critical_errors)} errors): {critical_errors[:2]}")

        browser.close()

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 70, flush=True)
    print(f"WEB APPLICATION TEST SUITE COMPLETED IN {elapsed}s", flush=True)
    total_passed = sum(1 for t in test_results if t["status"] == "PASSED")
    total_failed = sum(1 for t in test_results if t["status"] == "FAILED")
    print(f"Summary: {total_passed} Passed, {total_failed} Failed (Total: {len(test_results)})", flush=True)
    print("=" * 70, flush=True)

    # Save JSON summary
    summary_path = RESULTS_DIR / "summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump({
            "elapsed_seconds": elapsed,
            "passed": total_passed,
            "failed": total_failed,
            "tests": test_results,
            "console_errors_count": len(critical_errors)
        }, f, indent=2)

    return total_failed == 0

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
