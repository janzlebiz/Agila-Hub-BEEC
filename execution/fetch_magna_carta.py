import sys
import urllib.request
import json
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

base = 'https://econstitution-cc3e.vercel.app/api'
endpoints = ['/content/pages', '/content/sync', '/guides', '/welcome']

out_dir = Path('d:/Antigravity/Agila Hub/.tmp')
out_dir.mkdir(parents=True, exist_ok=True)

for ep in endpoints:
    url = base + ep
    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            parsed = json.loads(data)
            print(f"  [✓] Status 200, length {len(data)} chars")
            if isinstance(parsed, list):
                print(f"  Items count: {len(parsed)}")
                if len(parsed) > 0:
                    print("  Sample item keys:", list(parsed[0].keys()))
                    if 'title' in parsed[0]:
                        print("  Sample title:", parsed[0].get('title'))
            elif isinstance(parsed, dict):
                print("  Dict keys:", list(parsed.keys()))
                for k in parsed.keys():
                    if isinstance(parsed[k], list):
                        print(f"    Sublist '{k}' count: {len(parsed[k])}")
            safe_name = ep.strip('/').replace('/', '_')
            with open(out_dir / f"api_{safe_name}.json", 'w', encoding='utf-8') as f:
                f.write(data)
    except Exception as e:
        print(f"  Error: {e}")
