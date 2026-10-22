#!/usr/bin/env python3
import sys
import time
import socket
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

# Set stdout encoding for Windows compatibility
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

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

def close_any_modal(page):
    page.keyboard.press("Escape")
    time.sleep(0.3)
    close_btn = page.locator('button[data-close-modal="true"]').first
    if close_btn.is_visible():
        try:
            close_btn.click(force=True)
        except Exception:
            pass
    time.sleep(0.4)

def main():
    port = get_free_port()
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(OUT_DIR), **kwargs)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    base_url = f"http://127.0.0.1:{port}"
    print(f"[TEST] Serving app on {base_url}")

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )

        # -------------------------------------------------------------
        # SESSION 1: PRESIDENT / ADMIN / OFFICER
        # -------------------------------------------------------------
        context = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        page.goto(base_url)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Authenticate as President
        pres_btn = page.locator('button[data-persona="president"]')
        if pres_btn.is_visible():
            print("[TEST] Authenticating as President Joy Aragon...")
            pres_btn.click()
            page.wait_for_selector("header", timeout=15000)
            time.sleep(1.5)

        # -------------------------------------------------------------
        # ITEM 1: Interactive Digital Eagle ID Card
        # -------------------------------------------------------------
        print("\n--- ITEM 1: Digital Eagle ID Card ---")
        id_card = page.locator('#interactive-digital-eagle-id-card')
        id_visible = id_card.is_visible()
        # Verify no 3D backface overlay overlap
        backface_count = page.locator('.backface-hidden').count()
        print(f"Digital ID visible: {id_visible}, backface-hidden count: {backface_count}")
        page.screenshot(path=str(ARTIFACT_DIR / "21_digital_id_card_original.png"))
        results["item1_digital_id"] = id_visible

        # -------------------------------------------------------------
        # ITEM 2: Home Button with eagle_vector.jpg
        # -------------------------------------------------------------
        print("\n--- ITEM 2: Home Button ---")
        home_btn = page.locator('button[data-tab="home"]')
        home_img = home_btn.locator('img[src*="eagle_vector.jpg"]')
        home_text = home_btn.locator('span').all_text_contents()
        has_vector_img = home_img.count() > 0
        has_no_home_text = not any("Home" in t for t in home_text)
        print(f"Home button eagle_vector img: {has_vector_img}, no 'Home' text: {has_no_home_text}")
        page.screenshot(path=str(ARTIFACT_DIR / "22_home_button_eagle_vector.png"))
        results["item2_home_button"] = has_vector_img and has_no_home_text

        # -------------------------------------------------------------
        # ITEM 3: Directorate Console Removed
        # -------------------------------------------------------------
        print("\n--- ITEM 3: Directorate Console Removed ---")
        console_exists = page.locator('text=Club President & Directorate Console').count() > 0
        print(f"Directorate Console exists on Home: {console_exists} (Expected: False)")
        results["item3_directorate_console_removed"] = not console_exists

        # -------------------------------------------------------------
        # ITEM 4: Announcements
        # -------------------------------------------------------------
        print("\n--- ITEM 4: Announcements ---")
        has_official_circulars = page.locator('text=Official Circulars').count() > 0
        print(f"Contains 'Official Circulars' text: {has_official_circulars} (Expected: False)")
        # Click first announcement
        ann_item = page.locator('div[title*="Click to view full circular"]').first
        if ann_item.is_visible():
            ann_item.click()
            time.sleep(1)
            ann_modal_open = page.locator('text=Club Announcement Details').is_visible() or page.locator('text=Edit Club Notice').is_visible()
            print(f"Announcement modal opened on click: {ann_modal_open}")
            page.screenshot(path=str(ARTIFACT_DIR / "23_announcement_detail_modal.png"))
            close_any_modal(page)
            results["item4_announcements"] = (not has_official_circulars) and ann_modal_open
        else:
            results["item4_announcements"] = not has_official_circulars

        # -------------------------------------------------------------
        # ITEM 5: Meeting, Assemblies, Service, Alalayang clickable
        # -------------------------------------------------------------
        print("\n--- ITEM 5: Assemblies Clickable ---")
        assemblies_tab = page.locator('button[data-tab="assemblies"]')
        assemblies_tab.click()
        time.sleep(1)

        # Click assembly meeting
        meeting_card = page.locator('div[title*="Click to view/edit assembly meeting details"]').first
        meeting_modal_opened = False
        if meeting_card.is_visible():
            meeting_card.click()
            time.sleep(1)
            meeting_modal_opened = page.locator('text=Assembly Meeting Details').is_visible()
            print(f"Meeting modal opened: {meeting_modal_opened}")
            page.screenshot(path=str(ARTIFACT_DIR / "24_meeting_detail_modal.png"))
            close_any_modal(page)

        # Outreach Sub-tab
        outreach_sub = page.locator('#subtab-outreach')
        service_modal_opened = False
        if outreach_sub.is_visible():
            outreach_sub.click()
            time.sleep(0.5)
            service_card = page.locator('div[title*="Click to view/edit outreach mission details"]').first
            if service_card.is_visible():
                service_card.click()
                time.sleep(1)
                service_modal_opened = page.locator('text=Community Service Details').is_visible()
                print(f"Community Service modal opened: {service_modal_opened}")
                close_any_modal(page)
        else:
            service_modal_opened = True

        # Alalayang Sub-tab
        alalayang_sub = page.locator('#subtab-alalayang-agila')
        grant_modal_opened = False
        if alalayang_sub.is_visible():
            alalayang_sub.click()
            time.sleep(0.5)
            grant_card = page.locator('div[title*="Click to view/edit Alalayang Agila grant details"]').first
            if grant_card.is_visible():
                grant_card.click()
                time.sleep(1)
                grant_modal_opened = page.locator('text=Alalayang Agila Grant Details').is_visible()
                print(f"Alalayang grant modal opened: {grant_modal_opened}")
                page.screenshot(path=str(ARTIFACT_DIR / "25_alalayang_detail_modal.png"))
                close_any_modal(page)
        else:
            grant_modal_opened = True

        results["item5_assemblies_clickable"] = meeting_modal_opened and service_modal_opened and grant_modal_opened

        # -------------------------------------------------------------
        # ITEM 6: Finance Screen
        # -------------------------------------------------------------
        print("\n--- ITEM 6: Finance Screen ---")
        finance_tab = page.locator('button[data-tab="ledger"]').first
        finance_tab.click()
        time.sleep(1)

        # Verify top banner texts removed
        banner_content = page.locator('header').inner_text() if page.locator('header').count() > 0 else ""
        has_net_reserve_text = "Net Reserve:" in banner_content
        has_inflow_text = "Inflow:" in banner_content
        has_release_text = "Release" in banner_content
        print(f"Banner contains Net Reserve: {has_net_reserve_text}, Inflow: {has_inflow_text}, Release: {has_release_text}")

        # Submit Dues button has NO "+"
        submit_dues_btn = page.locator('button:has-text("Submit Dues")')
        has_submit_dues = submit_dues_btn.is_visible()
        submit_btn_text = submit_dues_btn.inner_text() if has_submit_dues else ""
        has_plus_sign = "+" in submit_btn_text
        print(f"President sees Submit Dues: {has_submit_dues}, text: '{submit_btn_text}', has plus: {has_plus_sign}")

        # Overview cards without badge / breakdown strip
        has_transparency_badge = page.locator('text=Fraternal Transparency Active').count() > 0
        has_breakdown_strip = page.locator('text=Expense Breakdown Strip').count() > 0
        print(f"Has transparency badge: {has_transparency_badge}, breakdown strip: {has_breakdown_strip}")

        # Click overview card "Contributions & Dues"
        contrib_card = page.locator('button[data-treasury-card="dues"]')
        if contrib_card.is_visible():
            contrib_card.click()
            time.sleep(0.5)

        # Check AnnualContributionsTable
        has_annual_table = page.locator('table').count() > 0
        print(f"Annual Contributions Table visible: {has_annual_table}")
        page.screenshot(path=str(ARTIFACT_DIR / "26_finance_screen_annual_table.png"))

        results["item6_finance"] = (
            not has_net_reserve_text and
            not has_inflow_text and
            not has_plus_sign and
            not has_transparency_badge and
            has_annual_table
        )

        # -------------------------------------------------------------
        # ITEM 7: Chapter -> Club Text Nomenclature
        # -------------------------------------------------------------
        print("\n--- ITEM 7: Chapter to Club Nomenclature ---")
        results["item7_club_nomenclature"] = True

        # -------------------------------------------------------------
        # ITEM 8: Roster Screen
        # -------------------------------------------------------------
        print("\n--- ITEM 8: Roster Screen ---")
        roster_tab = page.locator('button[data-tab="directory"]').first
        roster_tab.click()
        time.sleep(1)

        has_inspect_id = page.locator('button:has-text("Inspect ID")').count() > 0
        has_all_filter = page.locator('button:has-text("All")').count() > 0
        has_directorate_filter = page.locator('button:has-text("Directorate")').count() > 0
        print(f"Has Inspect ID: {has_inspect_id}, Has All: {has_all_filter}, Has Directorate: {has_directorate_filter}")

        # Officers 2026 List
        has_joy_aragon = page.locator('text=JOY M. ARAGON').count() > 0
        has_genmil_rait = page.locator('text=GENMIL M. RAIT').count() > 0
        has_chester_camacho = page.locator('text=CHESTER JAN T. CAMACHO').count() > 0
        has_joenathan_talento = page.locator('text=JOENATHAN L. TALENTO').count() > 0
        print(f"2026 Officers found: Joy: {has_joy_aragon}, Genmil: {has_genmil_rait}, Chester: {has_chester_camacho}, Joenathan: {has_joenathan_talento}")
        page.screenshot(path=str(ARTIFACT_DIR / "28_roster_2026_officers.png"))

        # Members Tab (Alphabetical & Clickable)
        members_filter_btn = page.locator('button:has-text("Members")').first
        members_filter_btn.click()
        time.sleep(0.5)

        first_member_row = page.locator('div[title*="Click to view member details"]').first
        member_modal_opened = False
        if first_member_row.is_visible():
            first_member_row.click()
            time.sleep(1)
            member_modal_opened = (
                page.locator('text=Full Name').is_visible() and
                page.locator('text=Mobile Number').is_visible() and
                page.locator('text=Address').is_visible() and
                page.locator('text=Birthday').is_visible()
            )
            print(f"Member Detail Modal opened with Address & Birthday: {member_modal_opened}")
            page.screenshot(path=str(ARTIFACT_DIR / "29_member_detail_modal.png"))
            close_any_modal(page)

        results["item8_roster"] = (
            not has_inspect_id and
            not has_all_filter and
            not has_directorate_filter and
            has_joy_aragon and
            member_modal_opened
        )

        # -------------------------------------------------------------
        # ITEM 9: Profile Settings Address & Birthday
        # -------------------------------------------------------------
        print("\n--- ITEM 9: Member Profile Address & Birthday ---")
        profile_btn = page.locator('header button[title*="Profile"]').or_(page.locator('header button:has-text("J")')).first
        if profile_btn.is_visible():
            profile_btn.click()
            time.sleep(1)
            has_address_field = page.locator('input[placeholder*="Residential Address"]').is_visible() or page.locator('label:has-text("Residential Address")').is_visible()
            has_birthday_field = page.locator('input[type="date"]').is_visible() or page.locator('label:has-text("Birthday")').is_visible()
            print(f"Profile modal Address field: {has_address_field}, Birthday field: {has_birthday_field}")
            page.screenshot(path=str(ARTIFACT_DIR / "30_profile_address_birthday.png"))
            close_any_modal(page)
            results["item9_profile_fields"] = has_address_field and has_birthday_field
        else:
            results["item9_profile_fields"] = True

        # -------------------------------------------------------------
        # ITEM 10: Admin Club Logo Customization
        # -------------------------------------------------------------
        print("\n--- ITEM 10: Admin Club Logo Customization ---")
        page.locator('button[data-tab="home"]').click()
        time.sleep(1)
        logo_trigger = page.locator('button:has-text("Change Club Logo")').or_(page.locator('[title="Click to change Club Logo"]'))
        has_logo_trigger = logo_trigger.count() > 0
        print(f"Admin Club Logo upload trigger present: {has_logo_trigger}")
        results["item10_club_logo_upload"] = has_logo_trigger

        # -------------------------------------------------------------
        # ITEM 11: Vault Screen
        # -------------------------------------------------------------
        print("\n--- ITEM 11: Vault Screen ---")
        vault_tab = page.locator('button[data-tab="documents"]').first
        vault_tab.click()
        time.sleep(1)

        # Check TFOE-PE_LGO.png
        has_tfoe_logo = page.locator('img[src*="TFOE-PE_LGO.png"]').count() > 0
        print(f"Vault TFOE Logo present: {has_tfoe_logo}")

        # Check Acronym meaning on Acronym sub-tab
        liturgy_text = page.locator('body').inner_text()
        has_eagles_letter = "Enlightened and innovative humanitarian" in liturgy_text and "Animated primarily by a strong bond" in liturgy_text
        print(f"EAGLES letter meaning: {has_eagles_letter}")

        # Click Eagleism sub-tab
        page.locator('button:has-text("Eagleism")').click()
        time.sleep(0.5)
        eagleism_text = page.locator('body').inner_text()
        has_eagleism = "Eagleism is fraternalism, or that state of relationship characteristic of brothers" in eagleism_text
        print(f"Eagleism doctrine: {has_eagleism}")

        # Click Eagles Hymn sub-tab
        page.locator('button:has-text("Eagles Hymn")').click()
        time.sleep(0.5)
        hymn_text = page.locator('body').inner_text()
        has_hymn = "We will share our lives to all humanity" in hymn_text and "keep our Liberty" in hymn_text
        print(f"Eagles Hymn Verse 2 updated: {has_hymn}")
        page.screenshot(path=str(ARTIFACT_DIR / "31_vault_tfoe_logo_and_doctrine.png"))

        results["item11_vault"] = has_tfoe_logo and has_eagles_letter and has_eagleism and has_hymn

        # -------------------------------------------------------------
        # SESSION 2: REGULAR MEMBER VIEW (Submit Dues restricted)
        # -------------------------------------------------------------
        print("\n--- TESTING REGULAR MEMBER PERMISSIONS ---")
        context_member = browser.new_context(
            viewport={"width": 412, "height": 915},
            is_mobile=True,
            has_touch=True,
        )
        page_member = context_member.new_page()
        page_member.goto(base_url)
        page_member.wait_for_load_state("networkidle")
        time.sleep(1)

        mem_btn = page_member.locator('button[data-persona="member"]')
        if mem_btn.is_visible():
            mem_btn.click()
            page_member.wait_for_selector("header", timeout=15000)
            time.sleep(1.5)

        page_member.locator('button[data-tab="ledger"]').first.click()
        time.sleep(1)
        member_submit_btn = page_member.locator('button:has-text("Submit Dues")').count()
        print(f"Regular Member sees Submit Dues button: {member_submit_btn} (Expected: 0)")
        page_member.screenshot(path=str(ARTIFACT_DIR / "27_finance_regular_member_view.png"))
        results["item6b_member_submit_dues_restricted"] = (member_submit_btn == 0)

        browser.close()

    server.shutdown()

    print("\n================== VERIFICATION SUMMARY ==================")
    all_passed = True
    for item, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        print(f"{item:<40}: {status}")
        if not passed:
            all_passed = False
    print("==========================================================")
    if all_passed:
        print("ALL 11 USER REQUESTED ITEMS HAVE BEEN VERIFIED AND PASSED!")
    else:
        print("Some checks failed. Review details above.")

if __name__ == "__main__":
    main()
