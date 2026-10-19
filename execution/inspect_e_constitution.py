import re
import urllib.request
import json

with open('d:/Antigravity/Agila Hub/.tmp/e_constitution_bundle.js', 'r', encoding='utf-8') as f:
    text = f.read()

urls = set(re.findall(r'https?://[^\s"\'`]+', text))
for u in sorted(urls):
    if any(k in u.lower() for k in ['constitution', 'vercel', 'api', 'tfoe']):
        print('URL:', u)

# Find api endpoint strings like /api/... or /auth/... or /constitution/...
routes = set(re.findall(r'["\'](/api/[^"\']+)["\']', text))
routes.update(re.findall(r'["\'](/(?:constitution|magna|document|search|articles|sections)[^"\']*)["\']', text, re.IGNORECASE))
print('\nRoutes/Endpoints:')
for r in sorted(routes):
    print('  ', r)

print("\n--- Searching for bt calls ---")
matches = re.finditer(r'bt\.(get|post|put|delete)\(["\']([^"\']+)["\']', text)
for m in matches:
    print(f"{m.group(1).upper()}: {m.group(2)}")

# Also look for any other endpoints or paths
for m in re.finditer(r'bt\(["\']([^"\']+)["\']', text):
    print(f"CALL: {m.group(1)}")

# Look for text constants or routes
for m in re.finditer(r'["\'](/constitution[^"\']*)["\']', text):
    print(f"CONST: {m.group(1)}")


