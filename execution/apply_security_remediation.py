#!/usr/bin/env python3
"""
AGILA Hub - Apply Security Audit Remediation Migration (F-01 through F-08)
Executes migration 20261019000006_security_audit_remediation.sql against Supabase.
"""
import os
import urllib.request
import json
import sys
from pathlib import Path

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "jgpigkeekfuawbyilycq")
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")

MIGRATION_FILES = [
    Path(__file__).parent.parent / "supabase" / "migrations" / "20261019000006_security_audit_remediation.sql",
    Path(__file__).parent.parent / "supabase" / "migrations" / "20261019000007_residual_security_remediation.sql",
]

def main():
    print("=" * 70)
    print("AGILA HUB: APPLY SECURITY AUDIT REMEDIATION MIGRATIONS")
    print("=" * 70)

    for mig_file in MIGRATION_FILES:
        if not mig_file.exists():
            print(f"[-] Migration file not found: {mig_file}")
            return 1

        sql_content = mig_file.read_text(encoding="utf-8")
        print(f"[+] Loaded migration: {mig_file.name} ({len(sql_content)} bytes)")

        if not ACCESS_TOKEN:
            print("[!] SUPABASE_ACCESS_TOKEN is not set in environment.")
            print(f"[!] The SQL migration file is saved at: {mig_file}")
            print("[!] Run with: $env:SUPABASE_ACCESS_TOKEN='<your_token>'; python execution/apply_security_remediation.py")
            print("[!] Or apply directly in Supabase Dashboard SQL Editor.")
            continue

        print(f"[+] Applying {mig_file.name} to Supabase project: {PROJECT_REF}...")
        url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = json.dumps({"query": sql_content}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req) as resp:
                data = resp.read().decode("utf-8")
                print(f"[✓] {mig_file.name} applied successfully to remote database!")
                print(data[:300])
        except Exception as e:
            print(f"[-] Error applying {mig_file.name}: {e}")
            return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
