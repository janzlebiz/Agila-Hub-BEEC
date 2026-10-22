"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Header } from "@/components/navigation/Header";
import { MobileNavBar } from "@/components/navigation/MobileNavBar";
import { DigitalIdCard } from "@/components/membership/DigitalIdCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  CreditCard,
  FileText,
  HeartHandshake,
  QrCode,
  Clock,
  MapPin,
  CheckCircle2,
  Shield,
  Users,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Camera,
  Plus,
  Search,
  IdCard,
  X,
  Radio,
  ArrowLeft,
  Home,
  UserPlus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  ArrowUpRight,
  Sliders,
  Receipt,
  Banknote,
  Landmark,
  ShieldCheck
} from "lucide-react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { QrAttendanceScanner } from "@/components/scanner/QrAttendanceScanner";
import { SubmitContributionModal } from "@/components/financial/SubmitContributionModal";
import { MemberDirectoryModal, DirectoryMember } from "@/components/directory/MemberDirectoryModal";
import { OfficialIdScannerModal } from "@/components/membership/OfficialIdScannerModal";
import { ProfileSettingsModal } from "@/components/profile/ProfileSettingsModal";
import { AddMemberModal } from "@/components/directory/AddMemberModal";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import { MagnaCartaRagModal } from "@/components/documents/MagnaCartaRagModal";
import { FraternalLiturgySection } from "@/components/documents/FraternalLiturgySection";
import { 
  MonthlyDuesAdjustmentModal, 
  MonthlyRateConfig, 
  RateProposal 
} from "@/components/financial/MonthlyDuesAdjustmentModal";
import { 
  RecordExpenseModal, 
  ExpenseRecord 
} from "@/components/financial/RecordExpenseModal";
import { 
  RecordAlalayangGrantModal, 
  AlalayangGrantRecord 
} from "@/components/assemblies/RecordAlalayangGrantModal";
import { AnnouncementDetailModal, AnnouncementItem } from "@/components/announcements/AnnouncementDetailModal";
import { MeetingDetailModal, MeetingItem } from "@/components/assemblies/MeetingDetailModal";
import { CommunityServiceDetailModal, CommunityServiceItem } from "@/components/assemblies/CommunityServiceDetailModal";
import { AlalayangDetailModal, AlalayangItem } from "@/components/assemblies/AlalayangDetailModal";
import { MemberDetailModal, MemberDetailItem } from "@/components/directory/MemberDetailModal";
import { AnnualContributionsTable } from "@/components/financial/AnnualContributionsTable";

const OFFICERS_2026 = [
  { position: "PRESIDENT", name: "JOY M. ARAGON", category: "Executive Officers" },
  { position: "VICE PRESIDENT", name: "GENMIL M. RAIT", category: "Executive Officers" },
  { position: "SECRETARY", name: "CHESTER JAN T. CAMACHO", category: "Executive Officers" },
  { position: "TREASURER", name: "JOENATHAN L. TALENTO", category: "Executive Officers" },
  { position: "AUDITOR", name: "JERIC R. MAGO", category: "Executive Officers" },
  { position: "PROTOCOL OFFICER", name: "RANDY B. DELFINALDO", category: "Protocol & Information" },
  { position: "PROTOCOL OFFICER", name: "STEWARD J. GARDOSE", category: "Protocol & Information" },
  { position: "INFORMATION OFFICER", name: "CHESTER JAN T. CAMACHO", category: "Protocol & Information" },
  { position: "PEACE OFFICER", name: "ROLDAN B. ROJAS", category: "Peace & Order" },
  { position: "PEACE OFFICER", name: "JOENATHAN L. TALENTO", category: "Peace & Order" },
  { position: "CARE CHAIRMAN", name: "DIVINO RAY A. PEREZ", category: "Committees" },
  { position: "COMELEC CHAIRMAN", name: "MARC POL R. QUIOZON", category: "Committees" },
  { position: "TRIBUNAL / GRIEVANCE CHAIRMAN", name: "JOY M. ARAGON", category: "Tribunal & Grievance" },
  { position: "TRIBUNAL / GRIEVANCE MEMBER", name: "ELISEO D. EBDANI", category: "Tribunal & Grievance" },
  { position: "REGIONAL ASSEMBLYMAN", name: "CHESTER JAN T. CAMACHO", category: "Regional Assembly" },
  { position: "REGIONAL ASSEMBLYMAN", name: "EDWIN T. ALEGRE", category: "Regional Assembly" },
  { position: "ALT. ASSEMBLYMAN", name: "ALLAN G. CALAYAN", category: "Regional Assembly" },
  { position: "ALT. ASSEMBLYMAN", name: "MARC POL R. QUIOZON", category: "Regional Assembly" },
  { position: "ALALAYAN AGILA CHAIRMAN", name: "JOENATHAN L. TALENTO", category: "Committees" },
  { position: "SPORT COORDINATOR", name: "MARC POL R. QUIOZON", category: "Committees" },
  { position: "COMMUNITY SERVICE CHAIRMAN", name: "GENMIL M. RAIT", category: "Committees" },
  { position: "COMMUNITY SERVICE CHAIRMAN", name: "JOENATHAN L. TALENTO", category: "Committees" },
  { position: "MEMBERSHIP CHAIRMAN", name: "GENMIL M. RAIT", category: "Committees" },
  { position: "MEMBERSHIP CHAIRMAN", name: "ROLDAN B. ROJAS", category: "Committees" },
  { position: "CHAIRMAN OF THE BOARD", name: "JOY M. ARAGON", category: "Board of Directors" },
  { position: "BOARD MEMBER", name: "ELISEO D. EBDANI", category: "Board of Directors" },
  { position: "BOARD MEMBER", name: "GENMIL M. RAIT", category: "Board of Directors" },
  { position: "BOARD MEMBER", name: "CHESTER JAN T. CAMACHO", category: "Board of Directors" },
];

interface MemberRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  member_number?: string | null;
  role: "admin" | "officer" | "member";
  membership_status: "pending" | "active" | "suspended" | "inactive";
  chapter_or_branch?: string | null;
  official_id_url?: string | null;
  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
  avatar_url?: string | null;
  blood_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  target_role: string;
  is_pinned: boolean;
  published_at?: string | null;
}

interface EventRecord {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string | null;
  checkin_code?: string | null;
  checkin_open: boolean;
  status: string;
}

interface ContributionRecord {
  id: string;
  member_id?: string | null;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  status: string;
  contribution_date: string;
  reference_number?: string | null;
}

interface DocumentRecord {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_url: string;
  access_level: string;
}

export default function HomePage() {
  const supabase = createClient();

  const [currentRole, setCurrentRole] = useState<"admin" | "officer" | "member">("member");
  // Navigation: Default tab is "home", center on bottom nav
  const [activeTab, setActiveTab] = useState<"home" | "assemblies" | "ledger" | "directory" | "documents">("home");
  const [assemblySubTab, setAssemblySubTab] = useState<"meetings" | "outreach" | "alalayang">("meetings");
  const [financeSubTab, setFinanceSubTab] = useState<"contributions" | "expenses">("contributions");
  const [officerDuesFilter, setOfficerDuesFilter] = useState<"all" | "mine">("all");
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xl" | "xxl">("normal");
  const [hydrated, setHydrated] = useState(false);

  // Monthly Contribution Policy (₱400 total = ₱100 renewal + ₱300 alalayang & service)
  const [monthlyRateConfig, setMonthlyRateConfig] = useState<MonthlyRateConfig>({
    totalAmount: 400,
    renewalAmount: 100,
    alalayangAndServiceAmount: 300,
    lastUpdated: "2026-10-01",
    approvedBy: "President Juan Dela Cruz",
  });
  const [pendingRateProposal, setPendingRateProposal] = useState<RateProposal | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Chapter Expenses Tracking
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: "exp-001",
      title: "TFOE-PE National Secretariat Membership Renewal Remittance (Q3/Q4)",
      category: "Membership Renewal",
      amount: 12000,
      disbursedTo: "The Fraternal Order of Eagles National Directorate",
      disbursementDate: "2026-10-02",
      voucherNumber: "EXP-2026-081",
      approvedBy: "President Juan Dela Cruz",
      status: "released",
      notes: "Annual membership renewal assessment for 30 active club members.",
    },
    {
      id: "exp-002",
      title: "Cardiac Surgery Aid - Kuya Juan Santos",
      category: "Alalayang Agila",
      amount: 15000,
      disbursedTo: "Kuya Juan Santos (Beneficiary)",
      disbursementDate: "2026-10-12",
      voucherNumber: "EXP-2026-088",
      approvedBy: "President Juan Dela Cruz",
      status: "released",
      notes: "Emergency medical benevolence grant approved under Alalayang Agila program.",
    },
    {
      id: "exp-003",
      title: "Sierra Madre Reforestation Hardwood Saplings & Seedlings",
      category: "Community Service",
      amount: 18500,
      disbursedTo: "Provincial Environment & Forest Nursery",
      disbursementDate: "2026-10-08",
      voucherNumber: "EXP-2026-084",
      approvedBy: "Treasurer Maria Santos",
      status: "released",
      notes: "Procurement of 1,000 native hardwood saplings for community watershed planting.",
    },
    {
      id: "exp-004",
      title: "Bereavement Memorial Fund - Late Kuya Ramon Cruz",
      category: "Alalayang Agila",
      amount: 20000,
      disbursedTo: "Cruz Family Estate",
      disbursementDate: "2026-09-28",
      voucherNumber: "EXP-2026-079",
      approvedBy: "President Juan Dela Cruz",
      status: "released",
      notes: "Fraternal bereavement grant and memorial tribute assistance.",
    },
    {
      id: "exp-005",
      title: "Community Dental & Medical Supplies Procurement",
      category: "Community Service",
      amount: 8500,
      disbursedTo: "Barangay Health Center Outreach Depot",
      disbursementDate: "2026-09-15",
      voucherNumber: "EXP-2026-075",
      approvedBy: "Treasurer Maria Santos",
      status: "released",
      notes: "Medicines and hygiene kits for 500+ barangay beneficiaries.",
    },
  ]);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);

  // Alalayang Agila Welfare Grants
  const [alalayangGrants, setAlalayangGrants] = useState<AlalayangGrantRecord[]>([
    {
      id: "aa-001",
      recipientName: "Kuya Juan Santos",
      recipientRelationship: "Member (Kuya/Ate)",
      chapterOrAffiliation: "Bantayog Elite Eagles Club",
      contactNumber: "+63 917 555 0192",
      category: "Medical & Hospitalization",
      reason: "Hospitalization and medical surgery assistance for acute cardiac procedure at provincial hospital.",
      amount: 15000,
      grantDate: "2026-10-12",
      voucherNumber: "AA-GRANT-2026-101",
      approvedBy: "President Juan Dela Cruz & Alalayang Agila Committee",
      status: "disbursed",
    },
    {
      id: "aa-002",
      recipientName: "Family of Late Kuya Ramon Cruz",
      recipientRelationship: "Spouse",
      chapterOrAffiliation: "Bantayog Elite Eagles Club",
      contactNumber: "+63 920 444 8831",
      category: "Bereavement & Memorial",
      reason: "Solemn fraternal bereavement grant and memorial assistance for the bereaved family.",
      amount: 20000,
      grantDate: "2026-09-28",
      voucherNumber: "AA-GRANT-2026-094",
      approvedBy: "President Juan Dela Cruz & Alalayang Agila Committee",
      status: "disbursed",
    },
    {
      id: "aa-003",
      recipientName: "Kuya Carlos Mendoza",
      recipientRelationship: "Member (Kuya/Ate)",
      chapterOrAffiliation: "Bantayog Elite Eagles Club",
      contactNumber: "+63 919 777 2209",
      category: "Calamity & Disaster Relief",
      reason: "Emergency calamity relief and home reconstruction grant following Typhoon Kristine flooding.",
      amount: 10000,
      grantDate: "2026-10-04",
      voucherNumber: "AA-GRANT-2026-099",
      approvedBy: "Club Directorate",
      status: "disbursed",
    },
  ]);
  const [isRecordGrantOpen, setIsRecordGrantOpen] = useState(false);

  // Live Database States
  const [loading, setLoading] = useState(true);
  const [authMember, setAuthMember] = useState<MemberRecord | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([
    {
      id: "cont-001",
      member_id: "m-04",
      title: "Monthly Fraternal Contribution (October 2026)",
      category: "Monthly Dues",
      amount: 400,
      payment_method: "GCash",
      reference_number: "GC-2026-10492",
      status: "verified",
      contribution_date: "2026-10-02",
    },
    {
      id: "cont-002",
      member_id: "m-04",
      title: "Monthly Fraternal Contribution (September 2026)",
      category: "Monthly Dues",
      amount: 400,
      payment_method: "GCash",
      reference_number: "GC-2026-09114",
      status: "verified",
      contribution_date: "2026-09-03",
    },
    {
      id: "cont-003",
      member_id: "m-01",
      title: "Alalayang Agila Emergency Hospitalization Benevolence Gift",
      category: "Donation",
      amount: 15000,
      payment_method: "Bank Transfer",
      reference_number: "BDO-DON-8841",
      status: "verified",
      contribution_date: "2026-10-05",
    },
    {
      id: "cont-004",
      member_id: "m-02",
      title: "Community Outreach Dental & Feeding Mission Support Donation",
      category: "Donation",
      amount: 10000,
      payment_method: "GCash",
      reference_number: "GC-DON-99231",
      status: "verified",
      contribution_date: "2026-09-20",
    },
    {
      id: "cont-005",
      member_id: "m-01",
      title: "Monthly Fraternal Contribution (October 2026)",
      category: "Monthly Dues",
      amount: 400,
      payment_method: "Bank Transfer",
      reference_number: "BDO-2026-1002",
      status: "verified",
      contribution_date: "2026-10-01",
    },
    {
      id: "cont-006",
      member_id: "m-02",
      title: "Monthly Fraternal Contribution (October 2026)",
      category: "Monthly Dues",
      amount: 400,
      payment_method: "GCash",
      reference_number: "GC-2026-1003",
      status: "verified",
      contribution_date: "2026-10-01",
    },
    {
      id: "cont-007",
      member_id: "m-03",
      title: "Monthly Fraternal Contribution (October 2026)",
      category: "Monthly Dues",
      amount: 400,
      payment_method: "GCash",
      reference_number: "GC-2026-1004",
      status: "verified",
      contribution_date: "2026-10-01",
    },
    {
      id: "cont-008",
      member_id: "m-03",
      title: "Special Typhoon Kristine Calamity Relief Pledge",
      category: "Donation",
      amount: 5000,
      payment_method: "GCash",
      reference_number: "GC-DON-11094",
      status: "verified",
      contribution_date: "2026-10-08",
    },
    {
      id: "cont-009",
      member_id: "m-01",
      title: "Pooled Club Member Dues (Q1-Q3 2026 Remittance)",
      category: "Monthly Dues",
      amount: 64000,
      payment_method: "Treasury Vault",
      reference_number: "BEEC-TR-2026-Q3",
      status: "verified",
      contribution_date: "2026-09-30",
    },
  ]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<MemberRecord[]>([]);
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);

  // Modals & Action States
  const [isSubmitContribOpen, setIsSubmitContribOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [inspectedMember, setInspectedMember] = useState<DirectoryMember | null>(null);
  const [verifyingContribId, setVerifyingContribId] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "admin" | "officer" | "member">("all");

  // Interactive Detail Modals & New States
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [selectedService, setSelectedService] = useState<CommunityServiceItem | null>(null);
  const [selectedAlalayang, setSelectedAlalayang] = useState<AlalayangItem | null>(null);
  const [selectedRosterMember, setSelectedRosterMember] = useState<MemberDetailItem | null>(null);
  const [rosterTab, setRosterTab] = useState<"officers" | "members">("officers");
  const [treasuryCardSelection, setTreasuryCardSelection] = useState<"reserves" | "dues" | "donations" | "expenses">("reserves");
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);

  // Community Services state
  const [communityServices, setCommunityServices] = useState<CommunityServiceItem[]>([
    {
      id: "cs-001",
      title: "Sierra Madre Watershed Reforestation Project",
      mission: "Active Community Mission",
      description: "Annual environmental sustainability and humanitarian outreach organized by Bantayog Elite Eagles Club in partnership with regional local government units and environmental committees.",
      targetBeneficiaries: "1,000 Hardwood Saplings",
      leadCommittee: "Humanitarian & Ecology",
      status: "Mobilizing Volunteers",
      projectDate: "2026-11-15",
      location: "Sierra Madre Watershed Sector",
    },
    {
      id: "cs-002",
      title: "Free Medical & Dental Mission",
      mission: "Scheduled Outreach",
      description: "Community health services providing medical consultations, vitamins, and dental checkups for underprivileged families in local barangays.",
      targetBeneficiaries: "500+ Barangay Residents",
      leadCommittee: "Health & Community Welfare",
      status: "Scheduled Outreach",
      projectDate: "2026-11-28",
      location: "Barangay Health Center Outreach Depot",
    },
  ]);

  // Profile & Official ID States
  const [isOfficialIdScannerOpen, setIsOfficialIdScannerOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [officialIdUrl, setOfficialIdUrl] = useState<string | null>(null);
  const [idCardBackUrl, setIdCardBackUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bloodType, setBloodType] = useState<string>("O+");
  const [assemblyHeadcount, setAssemblyHeadcount] = useState<number>(38);
  const [realtimeToast, setRealtimeToast] = useState<{
    title: string;
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  // Magna Carta & RAG AI States
  const [isMagnaCartaRagOpen, setIsMagnaCartaRagOpen] = useState(false);
  const [magnaCartaInitialQuery, setMagnaCartaInitialQuery] = useState("");
  const [ragInlineQuery, setRagInlineQuery] = useState("");

  // Interactive Live Check-in States
  const [checkInCode, setCheckInCode] = useState("AGILA-GMM-2026");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Onboarding & Direct Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Logout Confirmation Modal State
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Theme & text size synchronization
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      // In Capacitor StatusBar:
      // Style.Dark gives light text/icons (for dark background)
      // Style.Light gives dark text/icons (for light background)
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? "#0A0F1D" : "#FFFFFF" }).catch(() => {});
    } catch (_) {
      // Safe fallback on browser/PWA
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
  }, [textSize]);

  // Fetch all live database records
  const fetchHubData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Check Authenticated Session & Load User Profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeRole: "admin" | "officer" | "member" = "member";

      if (user) {
        const { data: memberData } = await supabase
          .from("members")
          .select(
            "id, first_name, last_name, email, phone, member_number, role, membership_status, chapter_or_branch, official_id_url, id_card_front_url, id_card_back_url, avatar_url, blood_type, emergency_contact_name, emergency_contact_phone"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          setAuthMember(memberData as MemberRecord);
          activeRole = memberData.role as "admin" | "officer" | "member";
          setCurrentRole(activeRole);
          if (memberData.official_id_url) setOfficialIdUrl(memberData.official_id_url);
          if (memberData.id_card_back_url) setIdCardBackUrl(memberData.id_card_back_url);
          if (memberData.avatar_url) setAvatarUrl(memberData.avatar_url);
          if (memberData.blood_type) setBloodType(memberData.blood_type);
        }
      }

      // 2. Fetch Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("id, title, content, category, priority, target_role, is_pinned, published_at")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (annData) setAnnouncements(annData as AnnouncementRecord[]);

      // 3. Fetch Events
      const { data: evtData } = await supabase
        .from("events")
        .select("id, title, description, event_date, location, checkin_code, checkin_open, status")
        .order("event_date", { ascending: true });

      if (evtData) setEvents(evtData as EventRecord[]);

      // 4. Fetch Contributions
      const { data: contData } = await supabase
        .from("contributions")
        .select("id, member_id, title, category, amount, payment_method, status, contribution_date, reference_number")
        .order("contribution_date", { ascending: false });

      if (contData && contData.length > 0) {
        setContributions((prev) => {
          const liveIds = new Set(contData.map((d) => d.id));
          const nonDuplicatedPrev = prev.filter((p) => !liveIds.has(p.id));
          return [...(contData as ContributionRecord[]), ...nonDuplicatedPrev];
        });
      }

      // 5. Fetch Documents
      const { data: docData } = await supabase
        .from("documents")
        .select("id, title, description, category, file_url, file_type, access_level")
        .order("category", { ascending: true });

      if (docData) setDocuments(docData as DocumentRecord[]);

      // 6. Fetch Pending Applicants (Role-gated)
      if (activeRole === "admin" || activeRole === "officer") {
        const { data: pendData } = await supabase
          .from("members")
          .select("id, first_name, last_name, email, phone, role, membership_status, chapter_or_branch")
          .eq("membership_status", "pending");

        if (pendData) setPendingApplicants(pendData as MemberRecord[]);
      } else {
        setPendingApplicants([]);
      }

      // 7. Fetch Active Members for Roster
      const { data: allMemData } = await supabase
        .from("members")
        .select("id, first_name, last_name, email, member_number, role, membership_status, chapter_or_branch")
        .eq("membership_status", "active")
        .order("first_name", { ascending: true });

      if (allMemData && allMemData.length > 0) {
        setAllMembers(allMemData as DirectoryMember[]);
      } else {
        // Pre-seed demo directory if empty
        setAllMembers([
          {
            id: "m-01",
            first_name: "Juan",
            last_name: "Dela Cruz",
            email: "president@agilahub.ph",
            member_number: "BEEC-2024-001",
            role: "admin",
            membership_status: "active",
            chapter_or_branch: "Bantayog Elite Eagles Club",
          },
          {
            id: "m-02",
            first_name: "Maria",
            last_name: "Santos",
            email: "treasurer@agilahub.ph",
            member_number: "BEEC-2024-002",
            role: "officer",
            membership_status: "active",
            chapter_or_branch: "Bantayog Elite Eagles Club",
          },
          {
            id: "m-03",
            first_name: "Ricardo",
            last_name: "Reyes",
            email: "secretary@agilahub.ph",
            member_number: "BEEC-2024-003",
            role: "officer",
            membership_status: "active",
            chapter_or_branch: "Bantayog Elite Eagles Club",
          },
          {
            id: "m-04",
            first_name: "Antonio",
            last_name: "Luna",
            email: "member@agilahub.ph",
            member_number: "BEEC-2025-101",
            role: "member",
            membership_status: "active",
            chapter_or_branch: "Bantayog Elite Eagles Club",
          },
        ]);
      }

      // 8. Fetch Assembly Headcount
      const { count: attCount } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true });
      if (typeof attCount === "number") {
        setAssemblyHeadcount(32 + attCount);
      }
    } catch (err) {
      console.error("Error fetching live database data:", err);
    } finally {
      // Smooth minimum splash presentation
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  // Supabase Realtime WebSocket Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("agila-hub-live-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => {
          fetchHubData();
          setAssemblyHeadcount((prev) => prev + 1);
          setRealtimeToast({
            title: "Assembly Quorum Live",
            message: "A brother / sister has recorded attendance!",
            type: "success",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        (payload) => {
          fetchHubData();
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as { title?: string; status?: string };
            setRealtimeToast({
              title: "Dues Verified",
              message: `${updated.title || "Contribution"} is marked ${updated.status?.toUpperCase()}`,
              type: "success",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          fetchHubData();
          setRealtimeToast({
            title: "Fraternal Alert",
            message: (payload.new as { title?: string }).title || "New circular published.",
            type: "warning",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHubData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (realtimeToast) {
      const timer = setTimeout(() => setRealtimeToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [realtimeToast]);

  // Time-based greeting helper
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Helpers to extract club affiliation and region
  const extractRegion = (raw?: string | null) => {
    if (!raw) return "Region V - Bicol Region";
    if (raw.includes("•")) {
      return raw.split("•")[1].trim();
    }
    return "Region V - Bicol Region";
  };

  const extractClub = (raw?: string | null) => {
    if (!raw) return "Bantayog Elite Eagles Club";
    if (raw.includes("•")) {
      return raw.split("•")[0].trim();
    }
    return raw;
  };

  // Direct login for unauthenticated portal
  const handleDirectLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || loginEmail;
    const passToUse = customPass || loginPassword;
    if (!emailToUse || !passToUse) {
      setAuthError("Please enter your email and password.");
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse.trim(),
        password: passToUse,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      await fetchHubData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Profile data displayed on Digital ID
  const activeProfile = inspectedMember
    ? {
        name: `Kuya/Ate ${inspectedMember.first_name} ${inspectedMember.last_name}`,
        nickname: inspectedMember.first_name,
        idNumber: inspectedMember.member_number || "AGILA-PENDING",
        club: extractClub(inspectedMember.chapter_or_branch),
        region: extractRegion(inspectedMember.chapter_or_branch),
        status: inspectedMember.membership_status,
      }
    : authMember
    ? {
        name: `${authMember.first_name} ${authMember.last_name}`,
        nickname: authMember.first_name,
        idNumber: authMember.member_number || "BEEC-2024-001",
        club: extractClub(authMember.chapter_or_branch),
        region: extractRegion(authMember.chapter_or_branch),
        status: authMember.membership_status,
      }
    : {
        admin: {
          name: "Kuya Juan Dela Cruz",
          nickname: "Juan",
          idNumber: "BEEC-2024-001",
          club: "Bantayog Elite Eagles Club",
          region: "Region V - Bicol Region",
          status: "active" as const,
        },
        officer: {
          name: "Ate Maria Santos",
          nickname: "Maria",
          idNumber: "BEEC-2024-002",
          club: "Bantayog Elite Eagles Club",
          region: "Region V - Bicol Region",
          status: "active" as const,
        },
        member: {
          name: "Kuya Antonio Luna",
          nickname: "Antonio",
          idNumber: "BEEC-2025-101",
          club: "Bantayog Elite Eagles Club",
          region: "Region V - Bicol Region",
          status: "active" as const,
        },
      }[currentRole];

  // Active check-in assembly
  const activeEvent = events.find((e) => e.checkin_open) || events[0];

  // Active user identification for personal dues scope filtering
  const activeUserMemberId = authMember?.id || (
    currentRole === "member"
      ? allMembers.find((m) => m.email === "member@agilahub.ph" || m.role === "member")?.id || "m-04"
      : currentRole === "officer"
      ? allMembers.find((m) => m.email === "treasurer@agilahub.ph" || m.role === "officer")?.id || "m-02"
      : allMembers.find((m) => m.email === "president@agilahub.ph" || m.role === "admin")?.id || "m-01"
  );

  // Helper to determine if a contribution belongs to the currently active user
  const isMyContribution = (c: ContributionRecord) => {
    // 1. Direct ID match
    if (authMember?.id && c.member_id === authMember.id) return true;
    if (activeUserMemberId && c.member_id === activeUserMemberId) return true;

    // 2. Resolve via allMembers directory mapping
    if (c.member_id) {
      const contribMember = allMembers.find((m) => m.id === c.member_id);
      if (contribMember) {
        if (authMember?.email && contribMember.email.toLowerCase() === authMember.email.toLowerCase()) return true;
        if (authMember?.member_number && contribMember.member_number === authMember.member_number) return true;
        if (!authMember && contribMember.role === currentRole) return true;
      }
    }
    return false;
  };

  // Chapter Inflow Calculations (Verified Records Only)
  const verifiedContributions = contributions.filter((c) => c.status === "verified");

  // 1. Total Dues & Regular Member Contributions Inflow
  const totalDuesInflow = verifiedContributions
    .filter((c) =>
      c.category === "Monthly Dues" ||
      c.category === "Annual Dues" ||
      c.category === "Membership Dues" ||
      (!c.category.toLowerCase().includes("donation") &&
       !c.category.toLowerCase().includes("pledge") &&
       !c.category.toLowerCase().includes("relief"))
    )
    .reduce((acc, c) => acc + Number(c.amount), 0);

  // 2. Total Donations & Special Pledges Inflow
  const totalDonationsInflow = verifiedContributions
    .filter((c) =>
      c.category.toLowerCase().includes("donation") ||
      c.category.toLowerCase().includes("pledge") ||
      c.category.toLowerCase().includes("relief") ||
      c.title.toLowerCase().includes("donation") ||
      c.title.toLowerCase().includes("pledge")
    )
    .reduce((acc, c) => acc + Number(c.amount), 0);

  // Total Verified Inflow
  const totalVerifiedDues = verifiedContributions.reduce((acc, c) => acc + Number(c.amount), 0);

  // Chapter Expenses & Alalayang calculations
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const netTreasuryReserve = totalVerifiedDues - totalExpenses;
  const totalAlalayangDisbursed = alalayangGrants.reduce((acc, g) => acc + Number(g.amount), 0);

  const renewalExpensesTotal = expenses
    .filter((e) => e.category === "Membership Renewal")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const serviceExpensesTotal = expenses
    .filter((e) => e.category === "Community Service")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const alalayangExpensesTotal = expenses
    .filter((e) => e.category === "Alalayang Agila")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  // Personal vs All Contributions
  // Members can only see their own contributions / dues; summary can be viewed by all
  const myPersonalContributions = contributions.filter(isMyContribution);
  const displayedContributions = currentRole === "member"
    ? myPersonalContributions
    : (officerDuesFilter === "mine" ? myPersonalContributions : contributions);

  // Check if current user is Treasurer or Secretary (strictly gates Submit Dues button)
  const isTreasurerOrSecretary = Boolean(
    (authMember && (
      authMember.email?.toLowerCase().includes("treasurer") || 
      authMember.email?.toLowerCase().includes("secretary") ||
      authMember.email === "treasurer@agilahub.ph" ||
      authMember.email === "secretary@agilahub.ph" ||
      (authMember.first_name?.toLowerCase().includes("maria") && authMember.role === "officer") ||
      (authMember.first_name?.toLowerCase().includes("chester") || authMember.last_name?.toLowerCase().includes("camacho")) ||
      (authMember.first_name?.toLowerCase().includes("joenathan") || authMember.last_name?.toLowerCase().includes("talento")) ||
      authMember.role === "admin"
    )) ||
    (!authMember && (currentRole === "officer" || currentRole === "admin"))
  );

  // Handle Club Logo Upload & Persistence
  const handleUpdateClubLogo = (newLogoUrl: string) => {
    setClubLogoUrl(newLogoUrl);
    try {
      localStorage.setItem("agila_club_logo", newLogoUrl);
    } catch (_) {}
    setRealtimeToast({
      title: "Club Logo Updated",
      message: "The official club crest has been updated across the portal and digital ID.",
      type: "success",
    });
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAuthMember(null);
      setCurrentRole("member");
      setRealtimeToast({
        title: "Signed Out",
        message: "You have signed out of AGILA Hub.",
        type: "info",
      });
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/auth/login";
    }
  };

  // Handle Officer Verification for Contributions
  const handleVerifyContribution = async (contribId: string, status: "verified" | "rejected") => {
    setVerifyingContribId(contribId);
    try {
      const { data, error } = await supabase.rpc("verify_contribution", {
        p_contribution_id: contribId,
        p_status: status,
      });

      if (!error && (data as { success: boolean })?.success) {
        setContributions((prev) =>
          prev.map((c) => (c.id === contribId ? { ...c, status } : c))
        );
      }
    } catch (err) {
      console.error("Error verifying contribution:", err);
    } finally {
      setVerifyingContribId(null);
    }
  };

  // Handle Monthly Contribution Rate Actions
  const handleApproveRateProposal = (proposalId: string) => {
    if (!pendingRateProposal || pendingRateProposal.id !== proposalId) return;
    const newConfig: MonthlyRateConfig = {
      totalAmount: pendingRateProposal.proposedTotal,
      renewalAmount: pendingRateProposal.proposedRenewal,
      alalayangAndServiceAmount: pendingRateProposal.proposedAlalayang,
      lastUpdated: new Date().toISOString().split("T")[0],
      approvedBy: "President Juan Dela Cruz",
    };
    setMonthlyRateConfig(newConfig);
    setPendingRateProposal(null);
    setRealtimeToast({
      title: "Rate Adjustment Approved",
      message: `Monthly contribution is now set to ₱${newConfig.totalAmount} (₱${newConfig.renewalAmount} renewal + ₱${newConfig.alalayangAndServiceAmount} Alalayang/Service).`,
      type: "success",
    });
  };

  const handleRejectRateProposal = (_proposalId?: string) => {
    setPendingRateProposal(null);
    setRealtimeToast({
      title: "Adjustment Rejected",
      message: "The proposed monthly contribution rate was dismissed.",
      type: "warning",
    });
  };

  // Filtered members for Roster
  const filteredDirectoryMembers = allMembers.filter((m) => {
    const term = directorySearch.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const memberNum = (m.member_number || "").toLowerCase();
    const chapter = (m.chapter_or_branch || "").toLowerCase();
    const matchesSearch = fullName.includes(term) || memberNum.includes(term) || chapter.includes(term);
    const matchesRole = directoryFilter === "all" || m.role === directoryFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Tactile Check-In
  const handleCheckIn = async (eventId: string) => {
    if (!checkInCode.trim()) return;
    setCheckInLoading(true);
    setCheckInFeedback(null);
    try {
      const { data, error } = await supabase.rpc("check_in_self_event", {
        p_event_id: eventId,
        p_checkin_code: checkInCode.trim().toUpperCase(),
      });

      if (error) {
        setCheckInFeedback({
          success: false,
          message: error.message || "Self check-in failed. Verify assembly quorum window is open.",
        });
        return;
      }

      if (data) {
        const res = data as { success: boolean; message: string };
        setCheckInFeedback({ success: res.success, message: res.message });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing check-in";
      setCheckInFeedback({ success: false, message: msg });
    } finally {
      setCheckInLoading(false);
    }
  };

  // Handle Candidate Approval
  const handleApproveApplicant = async (memberId: string) => {
    setApprovingId(memberId);
    try {
      const { data, error } = await supabase.rpc("approve_member_applicant", {
        p_member_id: memberId,
      });

      if (!error && (data as { success: boolean })?.success) {
        setPendingApplicants((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch (err) {
      console.error("Error approving applicant:", err);
    } finally {
      setApprovingId(null);
    }
  };

  // ===========================================================================
  // 1. DEDICATED LOADING SPLASH SCREEN WITH AGILA HUB LOGO
  // ===========================================================================
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white selection:bg-eagle-blue animate-fadeIn">
        {/* Background ambient orbs */}
        <div className="absolute w-96 h-96 bg-eagle-blue/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-5">
          {/* Official AGILA Hub Logo */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-white p-3 shadow-2xl border-2 border-amber-400/80 flex items-center justify-center">
            <Image
              src="/assets/AGILA Hub.png"
              alt="AGILA Hub"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center justify-center gap-2">
              AGILA HUB
              <span className="h-2 w-2 rounded-full bg-bumblebee-yellow inline-block animate-ping" />
            </h1>
            <p className="text-xs font-bold text-amber-400 tracking-widest uppercase">
              TFOE-PE, INC.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-eagle-blue animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-bumblebee-yellow animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              Initializing secure session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 2. UNAUTHENTICATED ONBOARDING & DIRECT SIGN-IN PORTAL
  // ===========================================================================
  if (!authMember) {
    return (
      <div
        data-hydrated={hydrated}
        className="min-h-screen flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-slate-950 text-white selection:bg-eagle-blue animate-fadeIn"
      >
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-eagle-blue/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md z-10 space-y-6">
          {/* Header Logos & Fraternal Identity */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-white shadow-2xl border-2 border-amber-400/80 mb-1">
              <Image
                src="/assets/AGILA Hub.png"
                alt="AGILA Hub"
                width={72}
                height={72}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center justify-center gap-2">
                AGILA HUB
              </h1>
              <p className="text-xs font-bold text-amber-400 tracking-widest uppercase mt-0.5">
                The Fraternal Order of Eagles (TFOE-PE)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Executive Portal for Members, Officers, and Club Directorate
              </p>
            </div>
          </div>

          {/* Direct Sign-In Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <h2 className="font-display font-bold text-sm text-white">
                  Member Sign In
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                SECURE ACCESS
              </span>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleDirectLogin(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Fraternal Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="eagle@agilahub.ph"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={authSubmitting}
                className="w-full py-2.5 text-xs font-bold shadow-lg flex items-center justify-center gap-2"
              >
                {authSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to AGILA Hub</span>
                )}
              </Button>
            </form>

            {/* Quick Test Persona Access for Evaluators / Officers */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Quick Test Persona Sign-In
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-persona="president"
                  disabled={authSubmitting}
                  onClick={() => handleDirectLogin(undefined, "president@agilahub.ph", "AgilaPresident2026!")}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Shield className="h-3.5 w-3.5" /> President
                </button>
                <button
                  type="button"
                  data-persona="member"
                  disabled={authSubmitting}
                  onClick={() => handleDirectLogin(undefined, "member@agilahub.ph", "AgilaMember2026!")}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-300 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Users className="h-3.5 w-3.5" /> Member
                </button>
              </div>
            </div>

            {/* Registration Link */}
            <div className="pt-2 text-center">
              <a
                href="/auth/register"
                className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline"
              >
                New Aspirant / Candidate? Apply for Membership
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-hydrated={hydrated} className="min-h-screen flex flex-col pb-28 text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* ===================================================================== */}
      {/* A. HOME VIEW (Contains Header, Greetings, Digital ID, Announcements)   */}
      {/* ===================================================================== */}
      {activeTab === "home" && (
        <>
          {/* Top Glass Header with pt-safe, single T text size, single Profile button, and logout */}
          <Header
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            textSize={textSize}
            onChangeTextSize={setTextSize}
            authMember={authMember}
            onOpenProfile={() => setIsProfileSettingsOpen(true)}
            onLogout={() => setIsLogoutConfirmOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
            {/* Fraternal Greeting Section: Time-based + Nickname only! */}
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Mabuhay ang Agila!
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {activeProfile.club}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {getTimeGreeting()}, {activeProfile.nickname}
                </h1>
              </div>

              {/* Inspected member from directory banner */}
              {inspectedMember && (
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-400/30 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 animate-fadeIn">
                  <span>Inspecting ID: {activeProfile.name}</span>
                  <button
                    type="button"
                    onClick={() => setInspectedMember(null)}
                    className="ml-3 text-[11px] text-eagle-blue dark:text-amber-300 underline font-bold"
                  >
                    Reset to My ID
                  </button>
                </div>
              )}
            </section>

            {/* Announcements Section (Item 4: Removed 'Official Circulars', clickable to view/edit details) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Announcements
                </h3>
                {(currentRole === "admin" || currentRole === "officer") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnnouncement({
                        id: `ann-${Date.now()}`,
                        title: "",
                        content: "",
                        category: "General",
                        priority: "normal",
                        published_at: new Date().toISOString(),
                      });
                      setIsNewAnnouncementOpen(true);
                    }}
                    className="text-xs font-bold text-eagle-blue dark:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Post Announcement
                  </button>
                )}
              </div>

              {announcements.length === 0 ? (
                <GlassCard variant="default" className="p-5 text-center text-xs text-slate-500">
                  No published announcements found.
                </GlassCard>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedAnnouncement(ann);
                      setIsNewAnnouncementOpen(false);
                    }}
                    className="p-5 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 cursor-pointer hover:border-eagle-blue/50 dark:hover:border-amber-400/40 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          ann.priority === "urgent" || ann.priority === "high"
                            ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                            : ann.category === "Finance"
                            ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                        }`}
                      >
                        {ann.priority === "urgent" ? "Urgent Circular" : ann.priority === "high" ? "High Priority" : "Official Notice"} • {ann.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <span>{ann.published_at ? new Date(ann.published_at).toLocaleDateString() : "Active"}</span>
                        <span className="text-eagle-blue dark:text-amber-300 font-bold group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white group-hover:text-eagle-blue dark:group-hover:text-amber-300 transition-colors">
                      {ann.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal line-clamp-2">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Interactive Digital Eagle ID Card (Moved below Announcements) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                  Interactive Digital Eagle ID Card
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  RFID & QR Smart Pass
                </span>
              </div>

              <DigitalIdCard
                fullName={activeProfile.name}
                nickname={activeProfile.nickname}
                memberNumber={activeProfile.idNumber}
                clubName={activeProfile.club}
                region={activeProfile.region}
                role={currentRole}
                status={activeProfile.status}
                bloodType={bloodType}
                avatarUrl={avatarUrl}
                clubLogoUrl={clubLogoUrl}
                onClubLogoUpload={handleUpdateClubLogo}
                emergencyContactName={authMember?.emergency_contact_name}
                emergencyContactPhone={authMember?.emergency_contact_phone}
                officialIdUrl={officialIdUrl || (inspectedMember?.official_id_url ?? null)}
                idCardBackUrl={idCardBackUrl || (inspectedMember?.id_card_back_url ?? null)}
                onOpenScanModal={() => setIsOfficialIdScannerOpen(true)}
                onUploadSelfieClick={() => setIsProfileSettingsOpen(true)}
              />
            </div>

            {/* Tactile Assembly Check-In Card (if active event) */}
            {activeEvent && (
              <GlassCard variant="glow-blue" className="p-5 shadow-lg border-eagle-blue/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={activeEvent.checkin_open ? "blue" : "neutral"} size="sm">
                        {activeEvent.checkin_open ? "Assembly Quorum Open" : "Upcoming Meeting"}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Quorum: {assemblyHeadcount} Checked In
                      </span>
                    </div>
                    <h4 
                      onClick={() => setSelectedMeeting({
                        id: activeEvent.id,
                        title: activeEvent.title,
                        description: activeEvent.description,
                        event_date: activeEvent.event_date,
                        location: activeEvent.location,
                        checkin_code: activeEvent.checkin_code,
                        checkin_open: activeEvent.checkin_open,
                        status: activeEvent.status,
                      })}
                      className="font-display font-bold text-base text-slate-900 dark:text-white cursor-pointer hover:underline"
                      title="Click to view/edit assembly details"
                    >
                      {activeEvent.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-eagle-blue shrink-0" />
                      {activeEvent.location || "Agila Clubhouse & Conference Hall"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      Date: {new Date(activeEvent.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-canvas-slate shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    <QrCode className="h-6 w-6 text-slate-800 dark:text-white" />
                  </div>
                </div>

                {checkInFeedback && (
                  <div
                    className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
                      checkInFeedback.success
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {checkInFeedback.success ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                    <span>{checkInFeedback.message}</span>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                    Enter Official Assembly Passcode:
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={checkInCode}
                        onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white text-center uppercase focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={checkInFeedback?.success ? "secondary" : "primary"}
                      disabled={checkInLoading}
                      onClick={() => handleCheckIn(activeEvent.id)}
                      className="h-11 px-5 text-xs font-bold shadow-md"
                    >
                      {checkInLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : checkInFeedback?.success ? (
                        "✓ Attendance Confirmed"
                      ) : (
                        "Confirm Attendance"
                      )}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
          </main>
        </>
      )}

      {/* ===================================================================== */}
      {/* B. TAB 1: ASSEMBLIES & COMMUNITY OUTREACH (NO Header & Utility Bar)    */}
      {/* ===================================================================== */}
      {activeTab === "assemblies" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-safe pt-6 space-y-6 animate-fadeIn">
          {/* Focused Tab Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Home
              </button>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
                Assemblies & Outreach
              </h2>
            </div>
          </div>

          {/* Sub-tab pills for Meetings, Community Service & Alalayang Agila */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 text-xs font-bold border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar gap-1">
            <button
              type="button"
              id="subtab-meetings"
              onClick={() => setAssemblySubTab("meetings")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                assemblySubTab === "meetings"
                  ? "bg-eagle-blue text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Assemblies ({events.length})
            </button>
            <button
              type="button"
              id="subtab-outreach"
              onClick={() => setAssemblySubTab("outreach")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                assemblySubTab === "outreach"
                  ? "bg-eagle-blue text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Community Service
            </button>
            <button
              type="button"
              id="subtab-alalayang-agila"
              onClick={() => setAssemblySubTab("alalayang")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                assemblySubTab === "alalayang"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Alalayang Agila ({alalayangGrants.length})</span>
            </button>
          </div>

          {assemblySubTab === "meetings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Official Club Calendar & Scheduled Meetings
                </span>
                {(currentRole === "admin" || currentRole === "officer") && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMeeting({
                        id: `evt-${Date.now()}`,
                        title: "",
                        description: "",
                        event_date: new Date().toISOString().split("T")[0],
                        location: "Daet Clubhouse",
                        checkin_code: "AGILA-" + Math.floor(1000 + Math.random() * 9000),
                        checkin_open: false,
                        status: "upcoming"
                      })}
                      className="px-3 py-1.5 rounded-xl bg-eagle-blue text-white text-xs font-bold shadow-sm hover:brightness-110 flex items-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Schedule Meeting
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                    >
                      <Camera className="h-3.5 w-3.5" /> Scanner
                    </button>
                  </div>
                )}
              </div>

              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedMeeting({
                    id: evt.id,
                    title: evt.title,
                    description: evt.description,
                    event_date: evt.event_date,
                    location: evt.location,
                    checkin_code: evt.checkin_code,
                    checkin_open: evt.checkin_open,
                    status: evt.status
                  })}
                  className="p-5 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-eagle-blue/50 dark:hover:border-amber-400/40 transition group"
                  title="Click to view/edit assembly meeting details"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-eagle-blue dark:group-hover:text-amber-300 transition-colors">
                        {evt.title.replace("[SEED] ", "")}
                      </h4>
                      {evt.checkin_open && (
                        <Badge variant="green" size="sm">
                          Quorum Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl line-clamp-2">
                      {evt.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                      <span>📍 {evt.location || "QC Clubhouse"}</span>
                      <span>📅 {new Date(evt.event_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {evt.checkin_code && (
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                        Code: {evt.checkin_code}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {assemblySubTab === "outreach" && (
            /* Incorporated Community Outreach Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Active & Scheduled Community Outreach Projects ({communityServices.length})
                </span>
                {(currentRole === "admin" || currentRole === "officer") && (
                  <button
                    type="button"
                    onClick={() => setSelectedService({
                      id: `cs-${Date.now()}`,
                      title: "",
                      description: "",
                      targetBeneficiaries: "",
                      leadCommittee: "Community Service",
                      status: "Mobilizing Volunteers",
                      mission: "Active Community Mission",
                      projectDate: new Date().toISOString().split("T")[0],
                      location: "Camarines Norte Sector",
                    })}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Propose Mission
                  </button>
                )}
              </div>

              {communityServices.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className="p-6 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm space-y-3 cursor-pointer hover:border-emerald-500/50 transition group"
                  title="Click to view/edit outreach mission details"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <HeartHandshake className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {srv.title}
                        </h4>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{srv.mission || "Community Mission"}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-600 font-bold transition">View Details →</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {srv.description}
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 font-medium border-t border-slate-100 dark:border-white/5 flex-wrap">
                    <span>Target: {srv.targetBeneficiaries}</span>
                    <span>Lead Committee: {srv.leadCommittee}</span>
                    <span>Status: {srv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {assemblySubTab === "alalayang" && (
            /* Alalayang Agila Beneficiaries & Grants Tab */
            <div className="space-y-4">
              {/* Alalayang Agila Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-canvas-slate border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-amber-500" />
                    <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                      Alalayang Agila Fraternal Benevolence Fund
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                    Official record of brotherly assistance released for medical, bereavement, calamity, and emergency relief for Kuya, Ate, and immediate dependents.
                  </p>
                  <div className="pt-1 flex items-center gap-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <span>Total Disbursed: ₱{totalAlalayangDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span>•</span>
                    <span>{alalayangGrants.length} Beneficiaries Assisted</span>
                  </div>
                </div>

                {(currentRole === "admin" || currentRole === "officer") && (
                  <button
                    type="button"
                    id="btn-record-alalayang-grant"
                    onClick={() => setIsRecordGrantOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95 shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Record Assistance Grant
                  </button>
                )}
              </div>

              {/* Beneficiary Records Grid (Item 5: Clickable to view and edit details) */}
              <div className="space-y-3">
                {alalayangGrants.map((grant) => (
                  <div
                    key={grant.id}
                    onClick={() => setSelectedAlalayang({
                      id: grant.id,
                      recipientName: grant.recipientName,
                      recipientRelationship: grant.recipientRelationship,
                      chapterOrAffiliation: grant.chapterOrAffiliation,
                      contactNumber: grant.contactNumber,
                      category: grant.category,
                      reason: grant.reason,
                      amount: grant.amount,
                      grantDate: grant.grantDate,
                      voucherNumber: grant.voucherNumber,
                      approvedBy: grant.approvedBy,
                      status: grant.status,
                    })}
                    className="p-5 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer hover:border-amber-500/50 transition group"
                    title="Click to view/edit Alalayang Agila grant details"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {grant.recipientName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {grant.recipientRelationship}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {grant.category}
                        </span>
                      </div>

                      {/* Reason / Circumstances */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Reason: </span>
                        {grant.reason}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-white/5 flex-wrap">
                        <span>📍 {grant.chapterOrAffiliation}</span>
                        <span>📅 {new Date(grant.grantDate).toLocaleDateString()}</span>
                        <span>Voucher: {grant.voucherNumber}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Approved: {grant.approvedBy}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Granted Amount</span>
                      <span className="font-mono font-black text-lg sm:text-xl text-emerald-600 dark:text-emerald-400">
                        ₱{grant.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Disbursed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* C. TAB 2: FINANCIAL LEDGER TAB (NO Header & Utility Bar)              */}
      {/* ===================================================================== */}
      {activeTab === "ledger" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-safe pt-6 space-y-6 animate-fadeIn">
          {/* Focused Tab Header (Item 6: Removed Net Reserve, Inflow, and Release text) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Home
              </button>
              <div>
                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
                  Fraternal Treasury & Finance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Official Club Financial Dashboard & Audited Accounts
                </p>
              </div>
            </div>

            {/* Action Buttons (Item 6: No '+', only visible to Treasurer and Secretary) */}
            <div className="flex items-center gap-2 shrink-0">
              {isTreasurerOrSecretary && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsSubmitContribOpen(true)}
                  className="text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Submit Dues
                </Button>
              )}
              {(currentRole === "admin" || currentRole === "officer") && (
                <button
                  type="button"
                  id="btn-open-record-expense"
                  onClick={() => setIsRecordExpenseOpen(true)}
                  className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> Record Expense
                </button>
              )}
            </div>
          </div>

          {/* 1. Treasury Overview Cards (Theme tokens, removed badge, removed breakdown strip, interactive selector) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm tracking-wide text-slate-900 dark:text-white">
                    Club Treasury & Financial Reserves Summary
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any overview card below to inspect full account details
                  </span>
                </div>
              </div>
            </div>

            {/* Main 4 Metric Cards Grid - Interactive click toggles full details */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Net Treasury Reserves */}
              <button
                type="button"
                onClick={() => setTreasuryCardSelection("reserves")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  treasuryCardSelection === "reserves"
                    ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-md"
                    : "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-emerald-500/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Net Treasury Reserves
                </span>
                <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400 block mt-1">
                  ₱{netTreasuryReserve.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Available club funds
                </span>
              </button>

              {/* 2. Monthly Contributions / Dues Inflow */}
              <button
                type="button"
                onClick={() => setTreasuryCardSelection("dues")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  treasuryCardSelection === "dues"
                    ? "bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30 shadow-md"
                    : "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-blue-500/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-eagle-blue dark:text-blue-400 block">
                  Contributions & Dues
                </span>
                <span className="font-mono font-black text-xl text-slate-900 dark:text-white block mt-1">
                  ₱{totalDuesInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  ₱400 monthly assessments
                </span>
              </button>

              {/* 3. Donations & Pledges Inflow */}
              <button
                type="button"
                onClick={() => setTreasuryCardSelection("donations")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  treasuryCardSelection === "donations"
                    ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/30 shadow-md"
                    : "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-amber-500/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Donations & Pledges
                </span>
                <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-400 block mt-1">
                  ₱{totalDonationsInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Voluntary & charity gifts
                </span>
              </button>

              {/* 4. Total Released Expenses */}
              <button
                type="button"
                onClick={() => setTreasuryCardSelection("expenses")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  treasuryCardSelection === "expenses"
                    ? "bg-rose-500/10 border-rose-500/50 ring-2 ring-rose-500/30 shadow-md"
                    : "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-rose-500/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  Total Released Expenses
                </span>
                <span className="font-mono font-black text-xl text-rose-600 dark:text-rose-400 block mt-1">
                  ₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Disbursed vouchers
                </span>
              </button>
            </div>
          </div>

          {/* 2. Monthly Contribution Rate Policy Banner (₱400 total = ₱100 renewal + ₱300 alalayang & service) */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-blue-500/10 dark:from-amber-500/10 dark:via-canvas-slate dark:to-eagle-blue/10 border border-amber-400/30 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-black text-sm text-slate-900 dark:text-white">
                      Monthly Contribution Policy: ₱{monthlyRateConfig.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Approved Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Breakdown: <span className="font-bold text-slate-700 dark:text-slate-200">₱{monthlyRateConfig.renewalAmount}</span> Membership Renewal • <span className="font-bold text-slate-700 dark:text-slate-200">₱{monthlyRateConfig.alalayangAndServiceAmount}</span> Alalayang Agila & Community Service
                  </p>
                </div>
              </div>

              {(currentRole === "admin" || currentRole === "officer") && (
                <button
                  type="button"
                  id="btn-adjust-monthly-dues"
                  onClick={() => setIsRateModalOpen(true)}
                  className="h-8 px-3 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
                >
                  <Sliders className="h-3.5 w-3.5" /> Adjust Policy Rate
                </button>
              )}
            </div>

            {/* Pending Rate Proposal Alert (If Present) */}
            {pendingRateProposal && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    Adjustment Proposed by {pendingRateProposal.proposedByName}: ₱{pendingRateProposal.proposedTotal} / mo (₱{pendingRateProposal.proposedRenewal} renewal + ₱{pendingRateProposal.proposedAlalayang} alalayang)
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    &ldquo;{pendingRateProposal.justification}&rdquo;
                  </span>
                </div>
                {currentRole === "admin" ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-approve-dues-rate"
                      onClick={() => handleApproveRateProposal(pendingRateProposal.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      id="btn-reject-dues-rate"
                      onClick={() => handleRejectRateProposal(pendingRateProposal.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md">
                    Pending Presidential Approval
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3. CARD DETAILS SECTION (Replaces old sub-tabs, shows full details of selected overview card) */}
          {/* OPTION 1: Net Treasury Reserves Details */}
          {treasuryCardSelection === "reserves" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Annual Contributions Table (Item 6 requirement: Year, Month, default amount, Due Date, Status, Amount Paid, Date Paid) */}
              <AnnualContributionsTable
                defaultRate={monthlyRateConfig.totalAmount}
                contributions={contributions}
                memberId={activeUserMemberId}
              />

              {/* Audited Balance Sheet Reconciliation Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                  <h4 className="font-display font-black text-sm text-slate-900 dark:text-white">
                    Fraternal Reserve Audit & Reconciliation
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Balanced Ledger
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">Total Verified Inflow</span>
                    <span className="font-mono font-black text-base text-emerald-700 dark:text-emerald-300 block mt-1">
                      +₱{totalVerifiedDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{verifiedContributions.length} verified receipts</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
                    <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase block">Total Audited Disbursements</span>
                    <span className="font-mono font-black text-base text-rose-700 dark:text-rose-300 block mt-1">
                      -₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{expenses.length} released vouchers</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block">Net Treasury Balance</span>
                    <span className="font-mono font-black text-base text-blue-700 dark:text-blue-300 block mt-1">
                      ₱{netTreasuryReserve.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Liquid reserves in vault</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: Contributions & Dues Full Details */}
          {treasuryCardSelection === "dues" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Annual Contributions Table */}
              <AnnualContributionsTable
                defaultRate={monthlyRateConfig.totalAmount}
                contributions={contributions}
                memberId={activeUserMemberId}
              />

              {/* Verified Ledger Records List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    {currentRole === "member" ? "My Personal Dues Records" : "All Club Contributions & Dues"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {displayedContributions.length} record{displayedContributions.length === 1 ? "" : "s"}
                  </span>
                </div>

                {displayedContributions.map((c) => {
                  const contributor = allMembers.find((m) => m.id === c.member_id);
                  const contributorName = contributor
                    ? `Kuya/Ate ${contributor.first_name} ${contributor.last_name}`
                    : null;

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {c.title.replace("[SEED] ", "")}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              c.status === "verified"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : c.status === "rejected"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {c.category}
                          </span>
                        </div>

                        {(currentRole === "admin" || currentRole === "officer") && contributorName && (
                          <span className="text-[11px] font-bold text-eagle-blue dark:text-blue-400 mt-1 block">
                            Member: {contributorName} {contributor?.member_number ? `(${contributor.member_number})` : ""}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          Method: {c.payment_method} {c.reference_number ? `• Ref: ${c.reference_number}` : ""} {c.contribution_date ? `• ${c.contribution_date}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                          ₱{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>

                        {c.status === "pending" && (currentRole === "admin" || currentRole === "officer") && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              disabled={verifyingContribId === c.id}
                              onClick={() => handleVerifyContribution(c.id, "verified")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1"
                            >
                              {verifyingContribId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Verify
                            </button>
                            <button
                              type="button"
                              disabled={verifyingContribId === c.id}
                              onClick={() => handleVerifyContribution(c.id, "rejected")}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-rose-100 hover:text-rose-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPTION 3: Donations & Pledges Full Details */}
          {treasuryCardSelection === "donations" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Voluntary Fraternal Donations & Humanitarian Pledges
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total Inflow: ₱{totalDonationsInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubmitContribOpen(true)}
                  className="text-xs font-bold"
                >
                  Pledge Donation
                </Button>
              </div>

              <div className="space-y-3">
                {contributions
                  .filter((c) =>
                    c.category.toLowerCase().includes("donation") ||
                    c.category.toLowerCase().includes("pledge") ||
                    c.category.toLowerCase().includes("relief") ||
                    c.title.toLowerCase().includes("donation") ||
                    c.title.toLowerCase().includes("pledge")
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {c.title.replace("[SEED] ", "")}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            {c.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Verified
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-1">
                          Date: {c.contribution_date} • Ref: {c.reference_number || "DIRECT"} • Channel: {c.payment_method}
                        </span>
                      </div>
                      <div className="shrink-0 font-mono font-black text-base text-amber-600 dark:text-amber-400">
                        +₱{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* OPTION 4: Total Released Expenses Full Details */}
          {treasuryCardSelection === "expenses" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Membership Renewal Remitted
                  </span>
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-white block mt-0.5">
                    ₱{renewalExpensesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500">National Directorate remittance</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    Alalayang Agila Grants
                  </span>
                  <span className="font-mono font-black text-lg text-amber-600 dark:text-amber-400 block mt-0.5">
                    ₱{alalayangExpensesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500">Medical & bereavement aid released</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">
                    Community Service Budget
                  </span>
                  <span className="font-mono font-black text-lg text-blue-600 dark:text-blue-400 block mt-0.5">
                    ₱{serviceExpensesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500">Outreach missions & projects</span>
                </div>
              </div>

              {/* Expenses List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Audited Expense Disbursements ({expenses.length} Records)
                  </span>
                  {(currentRole === "admin" || currentRole === "officer") && (
                    <button
                      type="button"
                      onClick={() => setIsRecordExpenseOpen(true)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> New Disbursement
                    </button>
                  )}
                </div>

                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {exp.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          {exp.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Released
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Disbursed to: <span className="font-semibold text-slate-700 dark:text-slate-300">{exp.disbursedTo}</span> • Voucher: <span className="font-mono">{exp.voucherNumber}</span>
                      </span>
                      {exp.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          &ldquo;{exp.notes}&rdquo;
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                        <span>📅 {new Date(exp.disbursementDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Authorized by: {exp.approvedBy}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/5">
                      <span className="font-mono font-black text-base text-rose-600 dark:text-rose-400">
                        -₱{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">DISBURSED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* D. TAB 3: ROSTER / DIRECTORY TAB (NO Header & Utility Bar)            */}
      {/* ===================================================================== */}
      {activeTab === "directory" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-safe pt-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Home
              </button>
              <div>
                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
                  Club Roster & Directory
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {rosterTab === "officers" ? `${OFFICERS_2026.length} Club Officers (2026)` : `${allMembers.length} Registered Members`}
                </span>
              </div>
            </div>

            {/* Register Member Trigger (Only for Admin & Officers) */}
            {(currentRole === "admin" || currentRole === "officer") && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAddMemberOpen(true)}
                className="text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 shadow-sm bg-gradient-to-r from-eagle-blue to-eagle-blue-dark hover:brightness-110"
              >
                <UserPlus className="h-3.5 w-3.5" /> Register Member
              </Button>
            )}
          </div>

          {/* Search & Filter Bar (Item 8: Removed 'All' and 'Directorate', strictly 'Officers' and 'Members') */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search Kuya/Ate by name or position..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
              />
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10 text-xs font-bold shrink-0 gap-1">
              <button
                type="button"
                id="roster-tab-officers"
                onClick={() => setRosterTab("officers")}
                className={`px-4 py-1.5 rounded-lg transition ${
                  rosterTab === "officers"
                    ? "bg-eagle-blue text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Officers (2026)
              </button>
              <button
                type="button"
                id="roster-tab-members"
                onClick={() => setRosterTab("members")}
                className={`px-4 py-1.5 rounded-lg transition ${
                  rosterTab === "members"
                    ? "bg-eagle-blue text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Members ({allMembers.length})
              </button>
            </div>
          </div>

          {/* 1. OFFICERS VIEW (Item 8: Set of Officers 2026 from officer20026.jpg) */}
          {rosterTab === "officers" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-amber-500/10 dark:via-canvas-slate dark:to-transparent border border-amber-400/30 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    SET OF OFFICERS 2026
                  </h3>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                    Bantayog Elite Eagles Club • Executive Directorate
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-xl">
                  TERM 2026
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OFFICERS_2026.filter((o) => {
                  if (!directorySearch.trim()) return true;
                  const term = directorySearch.toLowerCase();
                  return o.name.toLowerCase().includes(term) || o.position.toLowerCase().includes(term);
                }).map((officer, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 hover:border-amber-400/40 transition"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                        {officer.position}
                      </span>
                      <h4 className="font-display font-black text-sm text-slate-900 dark:text-white">
                        {officer.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {officer.category}
                      </span>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                      <Shield className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MEMBERS VIEW (Item 8: Alphabetical registered members, clickable to view details modal) */}
          {rosterTab === "members" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Registered Club Members (Alphabetical Order • Click to view details)
                </span>
                <span className="text-[11px] text-slate-400">
                  {allMembers.length} Members in Roster
                </span>
              </div>

              {[...allMembers]
                .sort((a, b) => {
                  const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                  const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .filter((m) => {
                  if (!directorySearch.trim()) return true;
                  const term = directorySearch.toLowerCase();
                  return (
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(term) ||
                    (m.member_number || "").toLowerCase().includes(term) ||
                    (m.phone || "").toLowerCase().includes(term)
                  );
                })
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedRosterMember(m)}
                    className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shadow-sm hover:border-eagle-blue/50 dark:hover:border-amber-400/40 cursor-pointer transition group"
                    title="Click to view member details (Address, Birthday, Mobile, Full Name)"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 p-0.5 shrink-0 shadow-sm">
                        <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center font-bold text-xs text-slate-900 dark:text-white">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-slate-900 dark:text-white group-hover:text-eagle-blue dark:group-hover:text-amber-300 transition-colors">
                            Kuya/Ate {m.first_name} {m.last_name}
                          </span>
                          <Badge variant={m.role === "admin" ? "gold" : m.role === "officer" ? "blue" : "neutral"} size="sm">
                            {m.role === "admin" ? "President / Directorate" : m.role === "officer" ? "Officer" : "Charter Member"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          {m.member_number || "BEEC-PENDING"} • {extractClub(m.chapter_or_branch)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-eagle-blue dark:group-hover:text-amber-300 transition-colors">
                      <span className="hidden sm:inline">Details</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* E. TAB 4: VAULT TAB (Item 11: Logo updated to TFOE-PE_LGO.png)         */}
      {/* ===================================================================== */}
      {activeTab === "documents" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-safe pt-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Home
              </button>
              <div>
                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
                  Document Vault
                </h2>
                <span className="text-xs text-slate-500 font-medium block">
                  Ratified Instruments & Magna Carta
                </span>
              </div>
            </div>
          </div>

          {/* Magna Carta & Constitution Card (Item 11: Updated Logo to TFOE-PE_LGO.png) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-lg text-slate-900 dark:text-white relative overflow-hidden">
            {/* Top Amber Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Official TFOE-PE Emblem Logo */}
                <div className="relative h-14 w-14 rounded-2xl bg-white p-1 border border-amber-400 shrink-0 shadow-md flex items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/TFOE-PE_LGO.png"
                    alt="TFOE-PE Official Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-slate-900 dark:text-white">
                    The Philippine Eagles Magna Carta & Constitution
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
                    Ratified Constitution, Code of Laws, Election Rules, and By-Laws of The Fraternal Order of Eagles, Philippine Eagles, Inc.
                  </p>
                </div>
              </div>

              {/* Action Buttons: 2024 Edition text beside Open Portal */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-amber-300 bg-slate-100 dark:bg-white/10 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10">
                  2024 Edition • 326 Pages • 21 Articles
                </span>
                <a
                  href="https://e-constitution.tfoe-peinc.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-eagle-blue hover:bg-eagle-blue-dark text-xs font-bold text-white flex items-center gap-1.5 shadow transition active:scale-95"
                  title="Open Official e-Constitution Portal"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Constitutional Query Input (Updated: button says "Ask AI", removed subtitle) */}
            <div className="relative z-10 mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    id="input-inline-magna-rag"
                    value={ragInlineQuery}
                    onChange={(e) => setRagInlineQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (ragInlineQuery.trim()) {
                          setMagnaCartaInitialQuery(ragInlineQuery.trim());
                          setIsMagnaCartaRagOpen(true);
                        }
                      }
                    }}
                    placeholder="Ask a question about the Magna Carta (e.g. membership rights, quorum, dues, discipline, elections)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
                <button
                  type="button"
                  id="btn-submit-inline-rag"
                  onClick={() => {
                    if (ragInlineQuery.trim()) {
                      setMagnaCartaInitialQuery(ragInlineQuery.trim());
                      setIsMagnaCartaRagOpen(true);
                    } else {
                      setIsMagnaCartaRagOpen(true);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white text-xs font-bold shadow flex items-center gap-1.5 transition shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Ask AI
                </button>
              </div>

              {/* Quick Inquiry Prompts */}
              <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Quick Inquiries:</span>
                {[
                  "Qualifications & Rights",
                  "Quorum & Assembly Rules",
                  "Dues & Financial Audit",
                  "Election Guidelines",
                  "Disciplinary Procedures",
                ].map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMagnaCartaInitialQuery(topic);
                      setIsMagnaCartaRagOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Official Fraternal Liturgy & Sacred Texts */}
          <FraternalLiturgySection />

          {/* Official Ratified Bylaws & Chapter Documents */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Official Bylaws & Executive Memoranda
            </span>

            {documents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 text-center text-xs text-slate-500">
                Official documents available via Secretariat portal.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {doc.title.replace("[SEED] ", "")}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {doc.description || "Official fraternal instrument"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs font-bold"
                    onClick={() => window.open(doc.file_url, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </Button>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* MODALS & PORTALS                                                      */}
      {/* ===================================================================== */}
      <QrAttendanceScanner
        eventId={activeEvent?.id || ""}
        eventTitle={activeEvent?.title || "Club Assembly"}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceRecorded={fetchHubData}
      />

      <SubmitContributionModal
        isOpen={isSubmitContribOpen}
        onClose={() => setIsSubmitContribOpen(false)}
        memberId={authMember?.id}
        memberName={activeProfile.name}
        monthlyRateConfig={monthlyRateConfig}
        onContributionSubmitted={fetchHubData}
      />

      {/* Monthly Contribution Policy Adjustment Modal */}
      <MonthlyDuesAdjustmentModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        currentRole={currentRole}
        currentConfig={monthlyRateConfig}
        pendingProposal={pendingRateProposal}
        onSubmitProposal={(prop) => {
          setPendingRateProposal(prop);
          setRealtimeToast({
            title: "Adjustment Proposed",
            message: `Proposed monthly rate of ₱${prop.proposedTotal} submitted for Presidential approval.`,
            type: "info",
          });
        }}
        onApproveProposal={(propId) => handleApproveRateProposal(propId)}
        onRejectProposal={(propId) => handleRejectRateProposal(propId)}
      />

      {/* Record Expense Disbursement Modal */}
      <RecordExpenseModal
        isOpen={isRecordExpenseOpen}
        onClose={() => setIsRecordExpenseOpen(false)}
        currentRole={currentRole}
        onExpenseRecorded={(newExp) => {
          setExpenses((prev) => [newExp, ...prev]);
          setRealtimeToast({
            title: "Expense Released",
            message: `₱${newExp.amount.toLocaleString()} released for ${newExp.category}.`,
            type: "success",
          });
        }}
      />

      {/* Record Alalayang Agila Grant Modal */}
      <RecordAlalayangGrantModal
        isOpen={isRecordGrantOpen}
        onClose={() => setIsRecordGrantOpen(false)}
        currentRole={currentRole}
        onGrantRecorded={(newGrant) => {
          setAlalayangGrants((prev) => [newGrant, ...prev]);
          // Sync to expense releases
          const grantExp: ExpenseRecord = {
            id: `exp-${Date.now()}`,
            title: `Alalayang Agila: ${newGrant.recipientName}`,
            category: "Alalayang Agila",
            amount: newGrant.amount,
            disbursedTo: `${newGrant.recipientName} (${newGrant.recipientRelationship})`,
            disbursementDate: newGrant.grantDate,
            voucherNumber: newGrant.voucherNumber,
            approvedBy: newGrant.approvedBy,
            status: "released",
            notes: newGrant.reason,
            created_at: new Date().toISOString(),
          };
          setExpenses((prev) => [grantExp, ...prev]);
          setRealtimeToast({
            title: "Alalayang Agila Disbursed",
            message: `₱${newGrant.amount.toLocaleString()} grant recorded for ${newGrant.recipientName}.`,
            type: "success",
          });
        }}
      />

      <MemberDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        members={allMembers}
        onSelectMember={(m) => {
          setInspectedMember(m);
          setIsDirectoryOpen(false);
          setActiveTab("home");
        }}
      />

      {/* Add New Member Modal for Admins & Officers */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberAdded={(newMem) => {
          setAllMembers((prev) => [newMem, ...prev]);
          setRealtimeToast({
            title: "Member Registered",
            message: `Kuya/Ate ${newMem.first_name} ${newMem.last_name} was added to the Club Roster!`,
            type: "success",
          });
        }}
      />

      <OfficialIdScannerModal
        isOpen={isOfficialIdScannerOpen}
        onClose={() => setIsOfficialIdScannerOpen(false)}
        memberId={authMember?.id}
        memberName={activeProfile.name}
        currentIdUrl={officialIdUrl}
        onIdUpdated={(newId, front, back) => {
          setOfficialIdUrl(newId);
          if (back) setIdCardBackUrl(back);
          if (authMember) {
            setAuthMember({ ...authMember, official_id_url: newId });
          }
          setRealtimeToast({
            title: "Official ID Updated",
            message: "Your physical Eagles ID card is active on your dashboard!",
            type: "success",
          });
        }}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        member={
          authMember
            ? {
                ...authMember,
                blood_type: bloodType,
                avatar_url: avatarUrl,
                official_id_url: officialIdUrl,
                id_card_front_url: officialIdUrl,
                id_card_back_url: idCardBackUrl,
              }
            : {
                id: "demo-id",
                first_name: activeProfile.nickname,
                last_name: "Dela Cruz",
                email: "president@agilahub.ph",
                role: currentRole,
                membership_status: "active",
                chapter_or_branch: "Bantayog Elite Eagles Club",
                blood_type: bloodType,
                avatar_url: avatarUrl,
                official_id_url: officialIdUrl,
              }
        }
        onProfileUpdated={(updated) => {
          if (updated && updated.first_name) {
            if (authMember) {
              setAuthMember({
                ...authMember,
                first_name: updated.first_name,
                last_name: updated.last_name ?? authMember.last_name,
                phone: updated.phone ?? authMember.phone,
                chapter_or_branch: updated.chapter_or_branch ?? authMember.chapter_or_branch,
                avatar_url: updated.avatar_url ?? authMember.avatar_url,
              });
            }
          }
          if (updated?.avatar_url !== undefined) setAvatarUrl(updated.avatar_url);
          if (updated?.blood_type) setBloodType(updated.blood_type);
        }}
        onOpenIdScanner={() => {
          setIsProfileSettingsOpen(false);
          setIsOfficialIdScannerOpen(true);
        }}
        onLogout={() => {
          setIsProfileSettingsOpen(false);
          setIsLogoutConfirmOpen(true);
        }}
      />

      <PwaInstallPrompt />

      <MagnaCartaRagModal
        isOpen={isMagnaCartaRagOpen}
        onClose={() => setIsMagnaCartaRagOpen(false)}
        initialQuery={magnaCartaInitialQuery}
      />

      {/* Toast Alert */}
      {realtimeToast && (
        <aside
          aria-label="Realtime Notification"
          className="fixed top-20 right-4 z-50 max-w-sm rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl border border-amber-400/40 backdrop-blur-xl animate-slideDown flex items-start gap-3"
        >
          <div className="h-8 w-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="font-display font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                {realtimeToast.title}
              </h5>
              <button
                onClick={() => setRealtimeToast(null)}
                className="text-slate-400 hover:text-white p-0.5"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug">
              {realtimeToast.message}
            </p>
          </div>
        </aside>
      )}

      {/* Floating Bottom Bar: 5 Tabs with HOME IN CENTER */}
      <MobileNavBar
        activeTab={activeTab}
        onTabChange={(tab) =>
          setActiveTab(tab as "home" | "assemblies" | "ledger" | "directory" | "documents")
        }
      />

      {/* Announcement Detail / Edit Modal */}
      <AnnouncementDetailModal
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => {
          setSelectedAnnouncement(null);
          setIsNewAnnouncementOpen(false);
        }}
        announcement={selectedAnnouncement}
        canEdit={currentRole === "admin" || currentRole === "officer"}
        isNew={isNewAnnouncementOpen}
        onSave={(updated) => {
          const record: AnnouncementRecord = {
            id: updated.id,
            title: updated.title,
            content: updated.content,
            category: updated.category,
            priority: updated.priority,
            target_role: updated.target_role || "all",
            is_pinned: Boolean(updated.is_pinned),
            published_at: updated.published_at || new Date().toISOString(),
          };
          setAnnouncements((prev) => {
            const idx = prev.findIndex((a) => a.id === record.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = record;
              return copy;
            }
            return [record, ...prev];
          });
          setRealtimeToast({
            title: isNewAnnouncementOpen ? "Announcement Posted" : "Announcement Updated",
            message: `"${updated.title}" has been saved.`,
            type: "success",
          });
        }}
        onDelete={(delId) => {
          setAnnouncements((prev) => prev.filter((a) => a.id !== delId));
          setRealtimeToast({
            title: "Announcement Deleted",
            message: "The notice has been removed.",
            type: "info",
          });
        }}
      />

      {/* Assembly Meeting Detail / Edit Modal */}
      <MeetingDetailModal
        isOpen={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        canEdit={currentRole === "admin" || currentRole === "officer"}
        onSave={(updated) => {
          const rec: EventRecord = {
            id: updated.id,
            title: updated.title,
            description: updated.description || "",
            event_date: updated.event_date,
            location: updated.location,
            checkin_code: updated.checkin_code,
            checkin_open: Boolean(updated.checkin_open),
            status: updated.status || "scheduled",
          };
          setEvents((prev) => {
            const idx = prev.findIndex((e) => e.id === rec.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = rec;
              return copy;
            }
            return [rec, ...prev];
          });
          setRealtimeToast({
            title: "Assembly Meeting Saved",
            message: `"${updated.title}" details updated successfully.`,
            type: "success",
          });
        }}
      />

      {/* Community Service Detail / Edit Modal */}
      <CommunityServiceDetailModal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        canEdit={currentRole === "admin" || currentRole === "officer"}
        onSave={(updated) => {
          setCommunityServices((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [updated, ...prev];
          });
          setRealtimeToast({
            title: "Outreach Mission Saved",
            message: `"${updated.title}" project details updated.`,
            type: "success",
          });
        }}
      />

      {/* Alalayang Agila Detail / Edit Modal */}
      <AlalayangDetailModal
        isOpen={Boolean(selectedAlalayang)}
        onClose={() => setSelectedAlalayang(null)}
        grant={selectedAlalayang}
        canEdit={currentRole === "admin" || currentRole === "officer"}
        onSave={(updated) => {
          const rec: AlalayangGrantRecord = {
            id: updated.id,
            recipientName: updated.recipientName || updated.beneficiaryName || "Brother Eagle",
            recipientRelationship: (updated.recipientRelationship || updated.relationship || "Member (Kuya/Ate)") as any,
            chapterOrAffiliation: updated.chapterOrAffiliation || "Bantayog Elite Eagles Club",
            contactNumber: updated.contactNumber,
            reason: updated.reason,
            category: (updated.category || "Medical & Hospitalization") as any,
            amount: updated.amount,
            grantDate: updated.grantDate || updated.dateGranted || new Date().toISOString().split("T")[0],
            voucherNumber: updated.voucherNumber || "VOUCHER-AUTO",
            approvedBy: updated.approvedBy || updated.approvedByName || "President Joy M. Aragon",
            status: updated.status === "disbursed" ? "disbursed" : "approved",
          };
          setAlalayangGrants((prev) =>
            prev.map((g) => (g.id === rec.id ? rec : g))
          );
          setRealtimeToast({
            title: "Benevolence Grant Updated",
            message: `Record for ${rec.recipientName} saved.`,
            type: "success",
          });
        }}
      />

      {/* Member Detail Modal (Item 8: Full Name, Mobile, Address, Birthday) */}
      <MemberDetailModal
        isOpen={Boolean(selectedRosterMember)}
        onClose={() => setSelectedRosterMember(null)}
        member={selectedRosterMember}
      />

      {/* Logout Confirmation Dialog Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Are you sure you want to log out of AGILA Hub? You will need your fraternal credentials to sign in again.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                id="btn-cancel-logout"
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="w-full text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-logout"
                variant="primary"
                size="sm"
                onClick={async () => {
                  setIsLogoutConfirmOpen(false);
                  await handleLogout();
                }}
                className="w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md border-0"
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
