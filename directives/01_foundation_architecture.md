# Directive 01: Foundation Architecture & Security Specification

> **Project**: AGILA Hub  
> **Target**: Mobile App (Capacitor + Next.js PWA) & Web Admin Dashboard (Vercel)  
> **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)  
> **Reference**: [AGENTS.md](../AGENTS.md) Layer 1 Directive

---

## 1. Objective and Scope

- **Objective**: Establish the authoritative online identity, role-based access control (RBAC), database schema, and Row-Level Security (RLS) policies for AGILA Hub.
- **In Scope**:
  - User identity, profile management, and membership lifecycle (`pending`, `active`, `suspended`, `inactive`).
  - Roles: `admin`, `officer`, `member`.
  - Onboarding workflow: Pre-registered directory matching + invite/claim, plus self-registration with officer approval.
  - Core domain models: Communications/Announcements, Events & Attendance, Contributions & Financial Records, Organization Documents, and Audit Logs.
  - Granular Postgres Row-Level Security (RLS) policies enforcing zero-trust data access.
  - Automated triggers to keep `auth.users` synchronized with `public.members`.
- **Out of Scope**:
  - External payment gateway SDK integrations (to be handled in Phase 2).
  - Push notification relay servers (APNs/FCM) (to be handled in Phase 3).

---

## 2. System Architecture

```text
[ Mobile App (Capacitor / PWA) ]     [ Web Admin Dashboard (Vercel) ]
               \                                  /
                \                                /
              [ Next.js App Router (Tailwind CSS) ]
                                |
                   (HTTPS / WSS / JWT Session)
                                |
                     [ Supabase Cloud ]
        +-----------------------+-----------------------+
        | Auth (GoTrue)         | PostgreSQL Database   |
        | - Email / Password    | - RBAC with Enum Roles|
        | - JWT with Claims     | - Granular RLS Policies|
        +-----------------------+-----------------------+
        | Storage (S3 API)      | Realtime Engine       |
        | - Club Documents      | - Urgent Broadcasts   |
        | - Payment Proofs      | - Live Check-ins      |
        +-----------------------+-----------------------+
```

---

## 3. Membership Lifecycle & Access Model

### 3.1 Roles
1. **`admin`**: Full administrative access over member approvals, roles, system configuration, financial audits, and document publishing.
2. **`officer`**: Operational leadership access: can check in members, create announcements, log and verify contributions, create events, and upload organizational files.
3. **`member`**: Standard verified member: access to personal profile, announcements, event calendar, self check-in (when event is open), personal contribution history, and member-accessible documents.

### 3.2 Registration & Onboarding Flow
1. **Pre-registered Directory**: Officers can pre-seed authorized members into `public.members` with email and member number. When a user registers with that matching email, their auth account is linked and automatically verified.
2. **Self-Registration**: New members registering without prior pre-seeding enter a `pending` status. They have restricted access (read-only welcome screen) until an Officer or Admin verifies and activates their membership.

---

## 4. Database Schema Specification

### 4.1 Tables
- **`members`**: Extends `auth.users`. Contains profile details, role, membership status, contact information, and membership ID.
- **`announcements`**: Broadcast messages, categorized by priority and audience (all members, officers only, etc.).
- **`events`**: Scheduled club meetings, outreach programs, and general assemblies.
- **`attendance`**: Attendance logs linking members to events, including check-in timestamp and verification method (QR scan, manual officer verification).
- **`contributions`**: Financial records tracking dues, donations, or project assessments, with verification status and proof attachment.
- **`documents`**: Centralized repository for club bylaws, meeting minutes, financial statements, and guidelines with access-tier tags.
- **`audit_logs`**: Immutable record of sensitive actions (role elevation, contribution status changes, member status changes).

### 4.2 Row-Level Security (RLS) Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| **`members`** | Active members see approved member directory; self sees full profile. | Handled via trigger on `auth.users`. | Self (bio, phone) or Admin/Officer (role, status). | Admin only. |
| **`announcements`** | Active members (public announcements) or Officers/Admins (internal). | Officer, Admin. | Author, Officer, Admin. | Officer, Admin. |
| **`events`** | Active members (published events); Officers/Admins (all). | Officer, Admin. | Officer, Admin. | Admin only. |
| **`attendance`** | Self (own records); Officers/Admins (all event records). | Self (if event open) or Officer/Admin. | Officer, Admin. | Admin only. |
| **`contributions`**| Self (own contributions); Officers/Admins (all records). | Self (submit contribution record) or Officer/Admin. | Officer, Admin (verify/reject). | Admin only. |
| **`documents`** | Based on `access_level` vs user role. | Officer, Admin. | Officer, Admin. | Admin only. |
| **`audit_logs`** | Admin and Officer only. | System trigger / functions only. | Disallowed (Immutable). | Disallowed. |

---

## 5. Execution Steps

1. Execute [`execution/supabase/0001_initial_schema.sql`](../execution/supabase/0001_initial_schema.sql) in the database.
2. Execute [`execution/supabase/0002_seed_data.sql`](../execution/supabase/0002_seed_data.sql) for development and initial verification.
3. Run [`execution/verify_schema.py`](../execution/verify_schema.py) to validate table structures, RLS activations, and security constraints.

---

## 6. Acceptance Criteria

- [ ] Every table in the `public` schema has `ROW LEVEL SECURITY` explicitly enabled.
- [ ] No table permits unauthenticated anonymous read or write.
- [ ] A non-officer member cannot update contribution verification statuses.
- [ ] Members in `pending` status cannot access private club documents or financial rosters.
- [ ] Profile creation is deterministic upon user registration via Postgres trigger.
