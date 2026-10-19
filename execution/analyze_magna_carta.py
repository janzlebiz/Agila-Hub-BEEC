import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

with open('d:/Antigravity/Agila Hub/.tmp/api_content_pages.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

pages = data.get('pages', [])
print(f"Total pages: {len(pages)}")

if pages:
    print("\nSample page keys:", list(pages[0].keys()))
    print("Sample page 0:")
    for k, v in pages[0].items():
        v_str = str(v)
        if len(v_str) > 100:
            v_str = v_str[:100] + "..."
        print(f"  {k}: {v_str}")

labels = {}
for p in pages:
    num = p.get('page_number')
    lbl = p.get('page_label')
    txt = (p.get('text') or '').strip().replace('\n', ' ')
    if lbl or num in [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 50, 100, 150, 200, 250, 300]:
        print(f"Page {num} [{lbl}]: {txt[:90]}...")

