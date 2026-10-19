#!/usr/bin/env python3
"""
Visual verification for Magna Carta & Constitution RAG in Google Chrome:
- Document Vault integration with official Magna Carta card
- e-Constitution link (https://e-constitution.tfoe-peinc.com/)
- Interactive RAG Q&A with constitutional citations
- 21 Articles directory & reader mode
"""
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCREENSHOT_DIR = Path("d:/Antigravity/Agila Hub/tests")
BASE_URL = "http://localhost:3000"

def run_test():
    print("[+] Launching Google Chrome via Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 920})
        page = context.new_page()

        print("[+] Navigating to Dashboard...")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_selector("main", timeout=15000)
        time.sleep(3)

        # 1. Click on Vault / Documents Docket Tab
        print("[+] Switching to Document Vault tab...")
        vault_tab = page.locator("button:has-text('Vault')").first
        vault_tab.wait_for(state="visible", timeout=10000)
        vault_tab.click()
        time.sleep(1)

        # Screenshot 1: Document Vault with Magna Carta hero card
        vault_shot = SCREENSHOT_DIR / "chrome_magna_carta_vault_tab.png"
        page.screenshot(path=str(vault_shot))
        print(f"  [✓] Vault tab captured to {vault_shot.name}")

        # 2. Test Inline RAG query
        print("[+] Testing Magna Carta RAG query...")
        input_rag = page.locator("#input-inline-magna-rag")
        input_rag.fill("What is the quorum requirement for chapter and assembly meetings?")
        btn_query = page.locator("#btn-submit-inline-rag")
        btn_query.click()

        # Wait for RAG modal to open
        page.wait_for_selector("text=Magna Carta Fraternal Counsel", timeout=10000)
        time.sleep(1)

        # Screenshot 2: RAG Answer with Constitutional Citations
        rag_shot = SCREENSHOT_DIR / "chrome_magna_carta_rag_answer.png"
        page.screenshot(path=str(rag_shot))
        print(f"  [✓] RAG Answer captured to {rag_shot.name}")

        # 3. Switch to Browse 21 Articles Tab
        print("[+] Testing Browse All 21 Articles tab...")
        articles_tab = page.locator("button:has-text('Browse All 21 Articles')")
        articles_tab.click()
        time.sleep(0.5)

        # Screenshot 3: Articles Directory
        articles_shot = SCREENSHOT_DIR / "chrome_magna_carta_articles_directory.png"
        page.screenshot(path=str(articles_shot))
        print(f"  [✓] Articles directory captured to {articles_shot.name}")

        # Expand an article (e.g. Article IV)
        expand_btn = page.locator("button:has-text('Read Full Article')").first
        if expand_btn.is_visible():
            expand_btn.click()
            time.sleep(0.5)
            expanded_shot = SCREENSHOT_DIR / "chrome_magna_carta_article_reading_view.png"
            page.screenshot(path=str(expanded_shot))
            print(f"  [✓] Expanded article reading view captured to {expanded_shot.name}")

        browser.close()
        print("\n[★] Magna Carta RAG Chrome verification completed successfully!")

if __name__ == "__main__":
    run_test()
