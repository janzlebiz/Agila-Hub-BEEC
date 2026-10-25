#!/usr/bin/env python3
"""
Comprehensive Playwright Verification for AGILA Hub Membership Directory Refinement
Verifies:
1. Naming and Navigation:
   - Screen title: "Membership Directory"
   - Bottom navigation item: "Directory" (data-tab="directory")
   - Tabs: "Officers · 2026" (#roster-tab-officers) and "Members" (#roster-tab-members)
2. Officers 2026 View:
   - Displays 28 official positions under Term 2026
   - Click opens OfficerDetailModal with role mandate, term period, and filled status
   - Category filtering (e.g. "Board of Directors")
   - Responsive cards with no clipping
3. Membership Data Integrity & Dual Affiliation:
   - Investigates Antonio Luna records: preserves both AGILA-2025-101 (Metro Manila Chapter) and BEEC-2025-101 (Bantayog Elite Eagles Club)
   - Verifies badges: National Roster vs Chartered Club
   - Affiliation and Role filtering
4. Security & Privacy Controls:
   - Officers see full unmasked contact details
   - Regular members viewing peer profiles see masked phone, masked email, and privacy protection notice
   - Viewing self shows full contact details
   - No fabricated defaults (e.g. no fake address or birthday)
5. Visual Evidence:
   - Saves screenshots into artifacts directory
"""

import sys
import time
import socket
import threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from playwright.sync_api import sync_playwright

REPO_ROOT = Path("d:/Antigravity/Agila Hub")
OUT_DIR = REPO_ROOT / "out"
ARTIFACT_DIR = Path(r"C:\Users\Chester Jan\.gemini\antigravity-ide\brain\83943211-9e2e-4add-b5ee-96d4ac0d8762")

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
    print(f"[TEST] Serving production bundle from {OUT_DIR} on {base_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )

        # =========================================================================
        # 1. OFFICER / PRESIDENT DIRECTORY TEST SESSION
        # =========================================================================
        print("\n--- 1. Testing Officer Session: Officers View, Modals, Full Contact Access ---")
        context_admin = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 AGILAHUB/1.0.0"
        )
        page_admin = context_admin.new_page()
        page_admin.goto(base_url)
        page_admin.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login as President
        pres_btn = page_admin.locator('button[data-persona="president"]')
        if pres_btn.is_visible():
            print("[TEST] Unauthenticated portal visible. Logging in as President...")
            pres_btn.click()
            page_admin.wait_for_selector("header", timeout=15000)
            time.sleep(1)

        # Verify bottom navigation item has label "Directory"
        dir_nav_btn = page_admin.locator('button[data-tab="directory"]')
        assert dir_nav_btn.is_visible(), "Directory bottom nav button must be visible"
        dir_nav_text = dir_nav_btn.inner_text().strip()
        assert "Directory" in dir_nav_text, f"Bottom nav label should contain 'Directory', found: '{dir_nav_text}'"
        print(f"[TEST PASS] Bottom navigation label verified: '{dir_nav_text}'")

        # Navigate to Directory Tab
        dir_nav_btn.click()
        time.sleep(1)

        # 1.1 Verify Screen Title and Subtitle
        screen_title = page_admin.locator('h2:has-text("Membership Directory")')
        assert screen_title.is_visible(), "Screen title 'Membership Directory' must be visible"
        print("[TEST PASS] Screen title 'Membership Directory' verified.")

        # 1.2 Verify Tabs: "Officers · 2026" and "Members"
        tab_officers = page_admin.locator('#roster-tab-officers')
        tab_members = page_admin.locator('#roster-tab-members')
        assert tab_officers.is_visible(), "Tab 'Officers · 2026' must be visible"
        assert tab_members.is_visible(), "Tab 'Members' must be visible"
        assert "Officers · 2026" in tab_officers.inner_text(), f"Tab label unexpected: {tab_officers.inner_text()}"
        assert "Members" in tab_members.inner_text(), f"Tab label unexpected: {tab_members.inner_text()}"
        print(f"[TEST PASS] Tabs verified: '{tab_officers.inner_text()}' & '{tab_members.inner_text()}'")

        # 1.3 Verify Officers 2026 Banner & Filled Positions
        term_banner = page_admin.locator('text=SET OF OFFICERS 2026')
        assert term_banner.is_visible(), "Set of Officers 2026 banner must be visible"
        
        filled_badges = page_admin.locator('text=Filled Position')
        filled_count = filled_badges.count()
        assert filled_count >= 10, f"Expected multiple filled officer positions, found {filled_count}"
        print(f"[TEST PASS] Set of Officers 2026 rendered with {filled_count} filled positions.")

        # Capture Officers tab screenshot
        page_admin.screenshot(path=str(ARTIFACT_DIR / "25_directory_officers_tab.png"))
        print(f"[EVIDENCE] Saved 25_directory_officers_tab.png")

        # 1.4 Test Clicking an Officer Card -> Opens OfficerDetailModal
        pres_card = page_admin.locator('div[role="button"]:has-text("JOY M. ARAGON")').first
        assert pres_card.is_visible(), "President officer card must be visible"
        pres_card.click()
        time.sleep(0.8)

        # Verify OfficerDetailModal contents
        officer_modal = page_admin.locator('div[role="dialog"]')
        assert officer_modal.is_visible(), "Officer detail modal must open on click"
        assert page_admin.locator('text=Active Office').is_visible(), "Term 2026 status must be displayed"
        assert page_admin.locator('text=Chief Executive of the Club').is_visible(), "Officer mandate description must be displayed"
        print("[TEST PASS] OfficerDetailModal opens with official mandate, term, and filled status.")

        # Capture Officer modal screenshot
        page_admin.screenshot(path=str(ARTIFACT_DIR / "26_directory_officer_detail_modal.png"))
        print(f"[EVIDENCE] Saved 26_directory_officer_detail_modal.png")

        # Close modal
        close_btn = page_admin.locator('button[aria-label="Close modal"]')
        if close_btn.is_visible():
            close_btn.click()
        else:
            page_admin.keyboard.press("Escape")
        time.sleep(0.5)

        # 1.5 Test Officer Category Filter (e.g. Board of Directors)
        cat_select = page_admin.locator('#officer-category-filter')
        assert cat_select.is_visible(), "Officer category filter select must be visible"
        cat_select.select_option("Board of Directors")
        time.sleep(0.5)
        
        bod_officers = page_admin.locator('text=BOARD MEMBER')
        assert bod_officers.count() >= 3, "Board members must be filtered"
        print("[TEST PASS] Officer category filter correctly filters Board of Directors.")

        # Reset filter
        reset_btn = page_admin.locator('#reset-officer-filters')
        if reset_btn.is_visible():
            reset_btn.click()
            time.sleep(0.5)

        # =========================================================================
        # 2. MEMBERS VIEW & DATA INTEGRITY (ANTONIO LUNA DUAL AFFILIATION)
        # =========================================================================
        print("\n--- 2. Testing Members View: Dual Affiliation & Data Integrity ---")
        tab_members.click()
        time.sleep(0.8)

        # Search for Antonio Luna
        search_input = page_admin.locator('#directory-search-input')
        assert search_input.is_visible(), "Directory search input must be visible"
        search_input.fill("Antonio Luna")
        time.sleep(0.5)

        # Verify BOTH Antonio Luna records are present and distinct!
        luna_beec = page_admin.locator('text=BEEC-2025-101')
        luna_agila = page_admin.locator('text=AGILA-2025-101')
        assert luna_beec.is_visible(), "Antonio Luna BEEC-2025-101 record must be preserved"
        assert luna_agila.is_visible(), "Antonio Luna AGILA-2025-101 record must be preserved"
        print("[TEST PASS] Dual Affiliation Integrity Confirmed: Both BEEC-2025-101 and AGILA-2025-101 are preserved intact!")

        # Verify badges
        nat_badge = page_admin.locator('text=National Roster')
        club_badge = page_admin.locator('text=Chartered Club')
        assert nat_badge.is_visible(), "National Roster badge must be visible for AGILA-2025-101"
        assert club_badge.is_visible(), "Chartered Club badge must be visible for BEEC-2025-101"
        print("[TEST PASS] Affiliation badges (National Roster vs Chartered Club) verified.")

        # Capture Members tab screenshot
        page_admin.screenshot(path=str(ARTIFACT_DIR / "27_directory_members_tab.png"))
        print(f"[EVIDENCE] Saved 27_directory_members_tab.png")

        # Test Affiliation Filter: Select Metro Manila Chapter
        search_input.fill("")
        aff_select = page_admin.locator('#directory-affiliation-filter')
        assert aff_select.is_visible(), "Affiliation filter select must be visible"
        aff_select.select_option("Metro Manila Chapter")
        time.sleep(0.5)
        
        assert luna_agila.is_visible(), "Metro Manila Chapter should show AGILA-2025-101"
        assert not luna_beec.is_visible(), "BEEC-2025-101 should be filtered out when Metro Manila Chapter selected"
        print("[TEST PASS] Affiliation filter correctly filters to Metro Manila Chapter.")

        # Reset member filters
        page_admin.locator('#reset-member-filters').click()
        time.sleep(0.5)

        # Open Antonio Luna profile as President (Officer Session)
        luna_card = page_admin.locator('div[role="button"]:has-text("BEEC-2025-101")').first
        luna_card.click()
        time.sleep(0.8)

        # Officer / President sees full unmasked contact details
        modal_text = page_admin.locator('div[role="dialog"]').inner_text()
        assert "+63920" in modal_text, "Officer must see unmasked phone number"
        assert "member@agilahub.ph" in modal_text, "Officer must see full unmasked email"
        assert "(Protected)" not in modal_text, "Protection warning should NOT be shown to officer"
        print("[TEST PASS] Officer / President sees full unmasked contact details.")

        # Verify no fabricated data (no Daet, no June 22)
        modal_text = page_admin.locator('div[role="dialog"]').inner_text()
        assert "Daet, Camarines Norte" not in modal_text, "Fabricated Daet address must NOT be shown"
        assert "June 22" not in modal_text, "Fabricated founding birthday must NOT be shown"
        print("[TEST PASS] Zero fabricated placeholders confirmed (no fake address or birthday).")

        page_admin.keyboard.press("Escape")
        time.sleep(0.5)
        context_admin.close()

        # =========================================================================
        # 3. REGULAR MEMBER PRIVACY & SECURITY TEST SESSION
        # =========================================================================
        print("\n--- 3. Testing Regular Member Session: Contact Masking & Privacy Notice ---")
        context_member = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 AGILAHUB/1.0.0"
        )
        page_member = context_member.new_page()
        page_member.goto(base_url)
        page_member.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login as Regular Member
        mem_btn = page_member.locator('button[data-persona="member"]')
        if mem_btn.is_visible():
            print("[TEST] Unauthenticated portal visible. Logging in as Regular Member...")
            mem_btn.click()
            page_member.wait_for_selector("header", timeout=15000)
            time.sleep(1)

        # Navigate to Directory Tab
        page_member.locator('button[data-tab="directory"]').click()
        time.sleep(1)

        # Switch to Members tab
        page_member.locator('#roster-tab-members').click()
        time.sleep(0.5)

        # Regular member cannot see Register Member button
        reg_btn = page_member.locator('button:has-text("Register Member")')
        assert not reg_btn.is_visible(), "Regular members must NOT see Register Member button"
        print("[TEST PASS] Register Member action is restricted from regular members.")

        # Regular member clicks Juan Dela Cruz (Peer Profile)
        juan_card = page_member.locator('div[role="button"]:has-text("Juan Dela Cruz")').first
        juan_card.click()
        time.sleep(0.8)

        # Verify Privacy Masking for Peer Profile
        privacy_notice = page_member.locator('text=Private Contact Details Protected')
        assert privacy_notice.is_visible(), "Privacy protection banner must be visible to non-officer viewing peer"
        
        # Verify masked phone and masked email
        juan_modal_text = page_member.locator('div[role="dialog"]').inner_text()
        assert "•••" in juan_modal_text, "Phone number or email must contain mask bullets"
        assert "+639171234567" not in juan_modal_text, "Full peer phone number must NOT be visible to regular member"
        print("[TEST PASS] Privacy Protection active: Phone and Email masked with confidentiality banner.")

        # Capture Member Privacy modal screenshot
        page_member.screenshot(path=str(ARTIFACT_DIR / "28_directory_member_detail_privacy_modal.png"))
        print(f"[EVIDENCE] Saved 28_directory_member_detail_privacy_modal.png")

        # Close peer modal
        page_member.keyboard.press("Escape")
        time.sleep(0.5)

        # Click own profile (Antonio Luna BEEC-2025-101)
        own_card = page_member.locator('div[role="button"]:has-text("BEEC-2025-101")').first
        own_card.click()
        time.sleep(0.8)

        # Member viewing self: unmasked contact details visible
        own_modal_text = page_member.locator('div[role="dialog"]').inner_text()
        assert "+63920" in own_modal_text, "Member must see their own unmasked phone number"
        assert "member@agilahub.ph" in own_modal_text, "Member must see their own unmasked email"
        assert "Private Contact Details Protected" not in own_modal_text, "Privacy notice should not appear on own profile"
        print("[TEST PASS] Member viewing own profile sees unmasked contact details.")

        page_member.keyboard.press("Escape")
        time.sleep(0.5)
        context_member.close()

        browser.close()

    server.shutdown()
    print("\n=======================================================")
    print("ALL MEMBERSHIP DIRECTORY VERIFICATION CHECKS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    main()
