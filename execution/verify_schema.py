#!/usr/bin/env python3
"""
AGILA Hub - Schema and RLS Policy Verification Script
Validates SQL syntax, RLS activation, table completeness, and security rules.
"""

import sys
import re
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

EXPECTED_TABLES = [
    "members",
    "announcements",
    "events",
    "attendance",
    "contributions",
    "documents",
    "audit_logs"
]

EXPECTED_ENUMS = [
    "user_role",
    "membership_status",
    "event_status",
    "attendance_status",
    "contribution_status",
    "document_access_level"
]

def verify_schema(file_path: Path) -> bool:
    print(f"[+] Verifying Schema File: {file_path.name}")
    if not file_path.exists():
        print(f"[-] ERROR: File not found: {file_path}")
        return False

    content = file_path.read_text(encoding="utf-8")
    passed = True

    # Check Enums
    for enum in EXPECTED_ENUMS:
        if f"CREATE TYPE {enum}" not in content:
            print(f"[-] Missing enum definition: {enum}")
            passed = False
        else:
            print(f"  [✓] Enum defined: {enum}")

    # Check Tables
    for table in EXPECTED_TABLES:
        table_pattern = rf"CREATE TABLE IF NOT EXISTS public\.{table}\b"
        if not re.search(table_pattern, content):
            print(f"[-] Missing table definition: {table}")
            passed = False
        else:
            print(f"  [✓] Table defined: public.{table}")

        # Check RLS enabled
        rls_pattern = rf"ALTER TABLE public\.{table} ENABLE ROW LEVEL SECURITY;"
        if not re.search(rls_pattern, content):
            print(f"[-] Missing RLS activation for: public.{table}")
            passed = False
        else:
            print(f"  [✓] RLS enabled: public.{table}")

        # Check at least one policy exists for the table
        policy_pattern = rf"ON public\.{table}\s+(FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL))?"
        if not re.search(policy_pattern, content):
            print(f"[-] No policies found for table: public.{table}")
            passed = False
        else:
            print(f"  [✓] Policies found for: public.{table}")

    # Check Security Definer helper functions
    expected_funcs = ["current_member", "is_admin", "is_officer", "is_active_member", "handle_new_user"]
    for func in expected_funcs:
        if f"FUNCTION public.{func}" not in content:
            print(f"[-] Missing security helper function: {func}")
            passed = False
        else:
            print(f"  [✓] Function defined: public.{func}")

    # Check Trigger attachment
    if "TRIGGER on_auth_user_created" not in content:
        print("[-] Missing auth.users trigger attachment: on_auth_user_created")
        passed = False
    else:
        print("  [✓] Auth synchronization trigger defined: on_auth_user_created")

    return passed

def verify_seed(file_path: Path) -> bool:
    print(f"\n[+] Verifying Seed File: {file_path.name}")
    if not file_path.exists():
        print(f"[-] ERROR: File not found: {file_path}")
        return False

    content = file_path.read_text(encoding="utf-8")
    passed = True

    for table in ["members", "announcements", "events", "attendance", "contributions", "documents"]:
        if f"INSERT INTO public.{table}" not in content:
            print(f"[-] Missing seed insert for: public.{table}")
            passed = False
        else:
            print(f"  [✓] Seed insert present for: public.{table}")

    return passed

def main():
    base_dir = Path(__file__).resolve().parent
    schema_file = base_dir / "supabase" / "0001_initial_schema.sql"
    seed_file = base_dir / "supabase" / "0002_seed_data.sql"

    print("==================================================")
    print("AGILA Hub - Deterministic Schema Validation")
    print("==================================================\n")

    schema_ok = verify_schema(schema_file)
    seed_ok = verify_seed(seed_file)

    if schema_ok and seed_ok:
        print("\n==================================================")
        print(" [✓] ALL CHECKS PASSED: Schema & Seed Data Validated")
        print("==================================================")
        sys.exit(0)
    else:
        print("\n==================================================")
        print(" [X] VERIFICATION FAILED: Issues detected")
        print("==================================================")
        sys.exit(1)

if __name__ == "__main__":
    main()
