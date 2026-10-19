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
  Bell,
  FileText,
  HeartHandshake,
  QrCode,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  FileCheck,
  Shield,
  Download,
  Users,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Landmark,
  Camera,
  Plus,
  Search,
  Receipt,
  IdCard,
  Eye,
  X,
} from "lucide-react";
import { QrAttendanceScanner } from "@/components/scanner/QrAttendanceScanner";
import { SubmitContributionModal } from "@/components/financial/SubmitContributionModal";
import { MemberDirectoryModal, DirectoryMember } from "@/components/directory/MemberDirectoryModal";
import { OfficialIdScannerModal } from "@/components/membership/OfficialIdScannerModal";
import { ProfileSettingsModal } from "@/components/profile/ProfileSettingsModal";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import { MagnaCartaRagModal } from "@/components/documents/MagnaCartaRagModal";
import { Radio, Wifi } from "lucide-react";

interface MemberRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  member_number?: string | null;
  role: "admin" | "officer" | "member";
  membership_status: "pending" | "active" | "suspended" | "inactive";
  chapter_or_branch?: string | null;
  official_id_url?: string | null;
  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
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
  const [docketTab, setDocketTab] = useState<"assemblies" | "ledger" | "directory" | "documents" | "community">("assemblies");
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xl">("normal");
  const [hydrated, setHydrated] = useState(false);

  // Live Database States
  const [loading, setLoading] = useState(true);
  const [authMember, setAuthMember] = useState<MemberRecord | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<MemberRecord[]>([]);
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);

  // Phase A, B, and D Modal & Action States
  const [isSubmitContribOpen, setIsSubmitContribOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [inspectedMember, setInspectedMember] = useState<DirectoryMember | null>(null);
  const [verifyingContribId, setVerifyingContribId] = useState<string | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "admin" | "officer" | "member">("all");

  // Phase 2 & 3: Official Eagles ID, Profile & Realtime States
  const [isOfficialIdScannerOpen, setIsOfficialIdScannerOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [officialIdUrl, setOfficialIdUrl] = useState<string | null>(null);
  const [idCardBackUrl, setIdCardBackUrl] = useState<string | null>(null);
  const [bloodType, setBloodType] = useState<string>("O+");
  const [assemblyHeadcount, setAssemblyHeadcount] = useState<number>(38);
  const [realtimeToast, setRealtimeToast] = useState<{
    title: string;
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(true);

  // Magna Carta & RAG AI States
  const [isMagnaCartaRagOpen, setIsMagnaCartaRagOpen] = useState(false);
  const [magnaCartaInitialQuery, setMagnaCartaInitialQuery] = useState("");
  const [ragInlineQuery, setRagInlineQuery] = useState("");

  // Interactive Live Check-in States
  const [checkInCode, setCheckInCode] = useState("AGILA-GMM-2026");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Sync theme and text size to root html element
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
            "id, first_name, last_name, email, phone, member_number, role, membership_status, chapter_or_branch, official_id_url, id_card_front_url, id_card_back_url, blood_type, emergency_contact_name, emergency_contact_phone"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          setAuthMember(memberData as MemberRecord);
          activeRole = memberData.role as "admin" | "officer" | "member";
          setCurrentRole(activeRole);
          if (memberData.official_id_url) setOfficialIdUrl(memberData.official_id_url);
          if (memberData.id_card_back_url) setIdCardBackUrl(memberData.id_card_back_url);
          if (memberData.blood_type) setBloodType(memberData.blood_type);
        }
      }

      // 2. Fetch Announcements (Explicit safe columns)
      const { data: annData } = await supabase
        .from("announcements")
        .select("id, title, content, category, priority, target_role, is_pinned, published_at")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (annData) setAnnouncements(annData as AnnouncementRecord[]);

      // 3. Fetch Events (Explicit safe columns)
      const { data: evtData } = await supabase
        .from("events")
        .select("id, title, description, event_date, location, checkin_code, checkin_open, status")
        .order("event_date", { ascending: true });

      if (evtData) setEvents(evtData as EventRecord[]);

      // 4. Fetch Contributions (Explicit ledger columns; private payment references/receipts only via authorized roles)
      const { data: contData } = await supabase
        .from("contributions")
        .select("id, member_id, title, category, amount, payment_method, status, contribution_date, reference_number")
        .order("contribution_date", { ascending: false });

      if (contData) setContributions(contData as ContributionRecord[]);

      // 5. Fetch Documents (Explicit safe columns)
      const { data: docData } = await supabase
        .from("documents")
        .select("id, title, description, category, file_url, file_type, access_level")
        .order("category", { ascending: true });

      if (docData) setDocuments(docData as DocumentRecord[]);

      // 6. Fetch Pending Applicants (Strictly role-gated: only query if session is officer or admin)
      if (activeRole === "admin" || activeRole === "officer") {
        const { data: pendData } = await supabase
          .from("members")
          .select("id, first_name, last_name, email, phone, role, membership_status, chapter_or_branch")
          .eq("membership_status", "pending");

        if (pendData) setPendingApplicants(pendData as MemberRecord[]);
      } else {
        setPendingApplicants([]);
      }

      // 7. Fetch Active Members for Roster / Directory (Excludes blood type, emergency contacts, receipts, and credential photos)
      const { data: allMemData } = await supabase
        .from("members")
        .select("id, first_name, last_name, email, member_number, role, membership_status, chapter_or_branch")
        .eq("membership_status", "active")
        .order("first_name", { ascending: true });

      if (allMemData) setAllMembers(allMemData as DirectoryMember[]);

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
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  // Phase 2: Supabase Realtime WebSocket Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("agila-hub-live-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        (payload) => {
          console.log("[Realtime] Attendance event:", payload);
          fetchHubData();
          setAssemblyHeadcount((prev) => prev + 1);
          setRealtimeToast({
            title: "Assembly Quorum Live",
            message: "A brother / sister has just recorded attendance!",
            type: "success",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        (payload) => {
          console.log("[Realtime] Contributions event:", payload);
          fetchHubData();
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as { title?: string; status?: string };
            setRealtimeToast({
              title: "Dues Verified Live",
              message: `${updated.title || "Contribution"} is now marked ${updated.status?.toUpperCase()}`,
              type: "success",
            });
          } else {
            setRealtimeToast({
              title: "New Dues Uploaded",
              message: "A member payment proof was received for review.",
              type: "info",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          console.log("[Realtime] Announcement event:", payload);
          fetchHubData();
          setRealtimeToast({
            title: "Fraternal Alert",
            message: (payload.new as { title?: string }).title || "New circular published by Secretariat.",
            type: "warning",
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHubData]);

  // Auto-dismiss realtime toast
  useEffect(() => {
    if (realtimeToast) {
      const timer = setTimeout(() => setRealtimeToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [realtimeToast]);

  // Profile data displayed on Digital ID
  const activeProfile = inspectedMember
    ? {
        name: `Kuya/Ate ${inspectedMember.first_name} ${inspectedMember.last_name}`,
        nickname: inspectedMember.first_name,
        idNumber: inspectedMember.member_number || "AGILA-PENDING",
        club: inspectedMember.chapter_or_branch || "Bantayog Elite Eagles Club",
        region: "National Executive / Region V",
        status: inspectedMember.membership_status,
      }
    : authMember
    ? {
        name: `${authMember.first_name} ${authMember.last_name}`,
        nickname: authMember.first_name,
        idNumber: authMember.member_number || "AGILA-PENDING",
        club: authMember.chapter_or_branch || "Bantayog Elite Eagles Club",
        region: "National Executive / Region V",
        status: authMember.membership_status,
      }
    : {
        admin: {
          name: "Kuya Juan Dela Cruz",
          nickname: "Juan",
          idNumber: "AGILA-2024-001",
          club: "Bantayog Elite Eagles Club",
          region: "National Executive / Bicol Region",
          status: "active" as const,
        },
        officer: {
          name: "Ate Maria Santos",
          nickname: "Maria",
          idNumber: "AGILA-2024-002",
          club: "Bantayog Elite Eagles Club",
          region: "Finance & Treasury / Region V",
          status: "active" as const,
        },
        member: {
          name: "Kuya Antonio Luna",
          nickname: "Antonio",
          idNumber: "AGILA-2025-101",
          club: "Bantayog Elite Eagles Club",
          region: "Metro Manila Chapter",
          status: "active" as const,
        },
      }[currentRole];

  // Active check-in assembly
  const activeEvent = events.find((e) => e.checkin_open) || events[0];

  // Total verified dues calculation
  const totalVerifiedDues = contributions
    .filter((c) => c.status === "verified")
    .reduce((acc, c) => acc + Number(c.amount), 0);

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

  // Filtered members for inline Roster tab
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
      // Self-service check-in bound strictly to authenticated session auth.uid()
      const { data, error } = await supabase.rpc("check_in_self_event", {
        p_event_id: eventId,
        p_checkin_code: checkInCode.trim().toUpperCase(),
      });

      // R-03: Fail closed. Do NOT fall back to legacy RPC if secure self check-in errors
      if (error) {
        setCheckInFeedback({
          success: false,
          message: error.message || "Self check-in failed. Please verify that the meeting check-in window is open.",
        });
        return;
      }

      if (data) {
        const res = data as { success: boolean; message: string; already_checked_in?: boolean };
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

  return (
    <div data-hydrated={hydrated} className="min-h-screen flex flex-col pb-24 sm:pb-12 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Top Glass Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        textSize={textSize}
        onChangeTextSize={setTextSize}
        authMember={authMember}
        onOpenProfile={() => setIsProfileSettingsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Fraternal Greeting Section (Natural Voice, No Single-word Accent Splits) */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Mabuhay ang Agila!
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {activeProfile.club}
              </span>
              {realtimeConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Radio className="h-3 w-3 animate-pulse" /> Live Realtime
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good day, {activeProfile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Authorized portal session active with {currentRole === "admin" ? "National Executive" : currentRole === "officer" ? "Club Officer" : "Charter Member"} credentials.
            </p>
          </div>

          {/* Quiet Standing Indicators */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="py-2.5 px-4 rounded-2xl bg-white/80 dark:bg-canvas-slate/80 border border-slate-200/90 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                  Fraternal Standing
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Good Standing • Dues Current
                </span>
              </div>
            </div>

            <div className="py-2.5 px-4 rounded-2xl bg-white/80 dark:bg-canvas-slate/80 border border-slate-200/90 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-eagle-blue flex items-center justify-center font-bold">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                  Regional Chapter
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Region V • Bicol Peninsula
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Layout Grid: Left = Hero Official Credential & Tactile Passcode / Right = Fraternal Action Docket */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Col 1: Hero Credential & Tactile Assembly Check-In */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                  Official Member Credential
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Verified RFID & QR
                </span>
              </div>

              {/* Inspected member from directory banner */}
              {inspectedMember && (
                <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-400/30 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 animate-fadeIn">
                  <span>Inspecting: {activeProfile.name}</span>
                  <button
                    type="button"
                    onClick={() => setInspectedMember(null)}
                    className="text-[11px] text-eagle-blue dark:text-amber-300 underline font-bold"
                  >
                    Reset to My ID
                  </button>
                </div>
              )}

              {/* The Physical Executive Polycarbonate Credential & Scanned Official ID */}
              <DigitalIdCard
                fullName={activeProfile.name}
                nickname={activeProfile.nickname}
                memberNumber={activeProfile.idNumber}
                clubName={activeProfile.club}
                region={activeProfile.region}
                role={currentRole}
                status={activeProfile.status}
                bloodType={bloodType}
                officialIdUrl={officialIdUrl || (inspectedMember?.official_id_url ?? null)}
                idCardBackUrl={idCardBackUrl || (inspectedMember?.id_card_back_url ?? null)}
                onOpenScanModal={() => setIsOfficialIdScannerOpen(true)}
              />
            </div>

            {/* Tactile Assembly Check-In Card */}
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
                        Live Quorum: {assemblyHeadcount} Checked In
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      {activeEvent.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-eagle-blue shrink-0" />
                      {activeEvent.location || "Agila Clubhouse & Conference Hall, QC"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      Assembly Date: {new Date(activeEvent.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-canvas-slate shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    <QrCode className="h-6 w-6 text-slate-800 dark:text-white" />
                  </div>
                </div>

                {/* Tactile PIN / Check-in Feedback */}
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

                {/* Tactile Passcode Input Block */}
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

                {/* Secretariat Camera QR Scanner Trigger */}
                {(currentRole === "admin" || currentRole === "officer") && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Secretariat Officer Console:
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Scan incoming members at registration door
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Launch QR Scanner</span>
                    </button>
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          {/* Col 2: The Fraternal Action Docket & Circulars */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* The Unified Fraternal Action Docket (Replaced generic 4 square tiles) */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-canvas-slate/80 backdrop-blur-deep p-2 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-slate-100/80 dark:bg-white/[0.05] rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDocketTab("assemblies")}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    docketTab === "assemblies"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-eagle-blue" />
                  <span className="truncate">Assemblies ({events.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("ledger")}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    docketTab === "ledger"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="truncate">Ledger (₱{totalVerifiedDues.toLocaleString()})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("directory")}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    docketTab === "directory"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="truncate">Roster ({allMembers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("documents")}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    docketTab === "documents"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span className="truncate">Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("community")}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    docketTab === "community"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <HeartHandshake className="h-3.5 w-3.5 text-purple-500" />
                  <span className="truncate">Outreach</span>
                </button>
              </div>

              {/* DOCKET CONTENT CONTAINER */}
              <div className="p-4 sm:p-5">
                {/* 1. ASSEMBLIES TAB */}
                {docketTab === "assemblies" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Official Chapter Calendar & Assemblies
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Live Secretariat Schedule
                      </span>
                    </div>

                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-eagle-blue/30 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                              {evt.title.replace("[SEED] ", "")}
                            </h5>
                            {evt.checkin_open && (
                              <Badge variant="green" size="sm">
                                Quorum Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {evt.description}
                          </p>
                          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            <span>📍 {evt.location || "QC Clubhouse"}</span>
                            <span>📅 {new Date(evt.event_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {evt.checkin_code && (
                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() => setCheckInCode(evt.checkin_code || "")}
                              className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-xs font-mono font-bold text-slate-800 dark:text-white hover:bg-eagle-blue hover:text-white transition"
                              title="Click to copy passcode to check-in box"
                            >
                              Code: {evt.checkin_code}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. FINANCIAL LEDGER TAB */}
                {docketTab === "ledger" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Fraternal Dues & Contribution Records
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Audited Secretariat Balance: ₱{totalVerifiedDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsSubmitContribOpen(true)}
                        className="text-xs font-bold flex items-center gap-1.5 h-8 px-3 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" /> Submit Dues / Donation
                      </Button>
                    </div>

                    {contributions.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
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
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            {c.category} • Method: {c.payment_method} {c.reference_number ? `(${c.reference_number})` : ""}
                          </span>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                            ₱{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>

                          {/* Officer Verification Buttons for Pending Contributions */}
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
                    ))}
                  </div>
                )}

                {/* 3. ROSTER / DIRECTORY TAB */}
                {docketTab === "directory" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Fraternal Member Directory & Chapter Roster
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          The Fraternal Order of Eagles • {allMembers.length} Registered Members
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={directorySearch}
                          onChange={(e) => setDirectorySearch(e.target.value)}
                          placeholder="Search Kuya/Ate by name, member ID, or chapter..."
                          className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                        />
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold">
                        {(["all", "admin", "officer", "member"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setDirectoryFilter(r)}
                            className={`px-2.5 py-1.5 rounded-xl capitalize transition shrink-0 text-[11px] ${
                              directoryFilter === r
                                ? "bg-eagle-blue text-white shadow-sm font-bold"
                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-slate-900"
                            }`}
                          >
                            {r === "all" ? "All" : r === "admin" ? "Directorate" : r === "officer" ? "Officers" : "Members"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredDirectoryMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 hover:border-eagle-blue/40 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 p-0.5 shrink-0 shadow-sm">
                              <div className="h-full w-full rounded-[10px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center font-bold text-xs text-slate-900 dark:text-white">
                                {m.first_name[0]}{m.last_name[0]}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                                  Kuya/Ate {m.first_name} {m.last_name}
                                </span>
                                <Badge variant={m.role === "admin" ? "gold" : m.role === "officer" ? "blue" : "neutral"} size="sm">
                                  {m.role === "admin" ? "Directorate" : m.role === "officer" ? "Officer" : "Charter"}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium block">
                                {m.member_number || "AGILA-PENDING"} • {m.chapter_or_branch || "Bantayog Elite Eagles Club"}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectedMember(m)}
                            className="text-xs font-bold shrink-0 h-8 px-2.5"
                          >
                            <IdCard className="h-3.5 w-3.5 mr-1 text-amber-500" /> Inspect ID
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. DOCUMENT VAULT TAB */}
                {docketTab === "documents" && (
                  <div className="space-y-4">
                    {/* Official Magna Carta & Constitution Hero Card with RAG */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1428] to-slate-950 border-2 border-amber-400/80 shadow-2xl text-white relative overflow-hidden">
                      {/* Gold foil metallic highlight bar */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="relative h-14 w-14 rounded-2xl bg-slate-900 border border-amber-400 p-1 shrink-0 shadow-lg flex items-center justify-center">
                            <Image
                              src="/assets/BEEC_official_crest.jpg"
                              alt="TFOE-PE Crest"
                              width={48}
                              height={48}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                Supreme Fraternal Law
                              </span>
                              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                                2024 Edition • 326 Pages • 21 Articles
                              </span>
                            </div>
                            <h4 className="font-display font-black text-lg text-white">
                              The Philippine Eagles Magna Carta & Constitution
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                              Ratified Constitution, Code of Laws, Election Rules, and By-Laws of The Fraternal Order of Eagles, Philippine Eagles, Inc.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            id="btn-open-magna-rag"
                            onClick={() => {
                              setMagnaCartaInitialQuery("");
                              setIsMagnaCartaRagOpen(true);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
                          >
                            <Sparkles className="h-4 w-4" /> Ask AI Counsel (RAG)
                          </button>
                          <a
                            href="https://e-constitution.tfoe-peinc.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition"
                            title="Open Official e-Constitution Portal"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Inline RAG Search Bar */}
                      <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
                        <span className="text-[11px] font-bold text-amber-300/90 block mb-2">
                          Interactive Constitutional Query (RAG):
                        </span>
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
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                            className="px-4 py-2.5 rounded-xl bg-eagle-blue hover:bg-blue-600 text-white text-xs font-bold shadow flex items-center gap-1.5 transition shrink-0"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Query RAG
                          </button>
                        </div>

                        {/* Quick Prompt Chips */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px]">
                          <span className="text-slate-400 font-semibold">Quick Inquiries:</span>
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
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-300 transition"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Official Ratified Bylaws & Executive Memoranda
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Encrypted Storage
                      </span>
                    </div>

                    {documents.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 text-center text-xs text-slate-500">
                        Constitution and chapter documents uploaded via Secretariat console.
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white block">
                              {doc.title.replace("[SEED] ", "")}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
                )}

                {/* 4. COMMUNITY OUTREACH TAB */}
                {docketTab === "community" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        <h5 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          Sierra Madre Watershed Reforestation
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Annual environmental sustainability outreach organized by Bantayog Elite Eagles Club in partnership with regional LGUs.
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 font-medium">
                        <span>Target: 1,000 Hardwood Saplings</span>
                        <span>Lead: Environmental Committee</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Executive Governance Console (Admin Access) */}
            {currentRole === "admin" && (
              <GlassCard variant="elevated" className="space-y-4 border-amber-300/80 dark:border-amber-400/20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Executive Directorate Console
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-300/60">
                    National Directorate Access
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Authoritative membership credentials, candidate admissions, and chapter governance audit.
                </p>

                {/* Candidate Admissions Review Queue */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-bold px-1">
                    <span>Membership Candidates ({pendingApplicants.length} Pending)</span>
                    <span className="text-xs text-eagle-blue font-bold hover:underline cursor-pointer">
                      Official Roster
                    </span>
                  </div>

                  {pendingApplicants.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                      <Check className="h-4 w-4 text-emerald-600" /> All candidate applications verified and inducted into good standing.
                    </div>
                  ) : (
                    pendingApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-canvas-slate border border-slate-300 dark:border-white/20 flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs">
                            {applicant.first_name[0]}
                            {applicant.last_name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white block">
                              {applicant.first_name} {applicant.last_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {applicant.email} • {applicant.chapter_or_branch || "Chapter Candidate"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={approvingId === applicant.id}
                            onClick={() => handleApproveApplicant(applicant.id)}
                            className="text-xs font-bold"
                          >
                            {approvingId === applicant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Approve Candidate"
                            )}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs font-bold">
                            Review Dossier
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Governance Quorum Status */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Governance Standing:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                    Constitution 2026 Ratified • Active Quorum
                  </span>
                  <Badge variant="green" size="sm">CONFIRMED</Badge>
                </div>
              </GlassCard>
            )}

            {/* Official Fraternal Announcements (Sentence-Case Badges & Cohesive Typography) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Official Announcements & Memoranda
                  </h3>
                </div>
                <span className="text-xs text-eagle-blue font-bold hover:underline cursor-pointer">
                  Secretariat Archive
                </span>
              </div>

              {announcements.length === 0 ? (
                <GlassCard variant="default" className="p-5 text-center text-xs text-slate-500">
                  No published circulars found in database.
                </GlassCard>
              ) : (
                announcements.map((ann) => (
                  <GlassCard key={ann.id} variant="default" className="p-5 space-y-2.5">
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
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : "Active Circular"}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {ann.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {ann.content}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 dark:border-white/5 font-medium">
                      <span>National Executive Secretariat</span>
                      <span className="text-eagle-blue dark:text-amber-300 font-bold cursor-pointer hover:underline">
                        Read Circular →
                      </span>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals for Phases A, B, and D */}
      <QrAttendanceScanner
        eventId={activeEvent?.id || ""}
        eventTitle={activeEvent?.title || "Chapter Assembly"}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceRecorded={fetchHubData}
      />

      <SubmitContributionModal
        isOpen={isSubmitContribOpen}
        onClose={() => setIsSubmitContribOpen(false)}
        memberId={authMember?.id}
        memberName={activeProfile.name}
        onContributionSubmitted={fetchHubData}
      />

      <MemberDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        members={allMembers}
        onSelectMember={(m) => {
          setInspectedMember(m);
          setIsDirectoryOpen(false);
        }}
      />

      {/* Official Physical Eagles ID Scanner Modal */}
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
            title: "Official ID Replaced",
            message: "Your official physical Eagles ID is now active on your dashboard!",
            type: "success",
          });
        }}
      />

      {/* Profile & Security Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        member={
          authMember
            ? {
                ...authMember,
                blood_type: bloodType,
                official_id_url: officialIdUrl,
                id_card_front_url: officialIdUrl,
                id_card_back_url: idCardBackUrl,
              }
            : {
                id: "demo-id",
                first_name: "Juan",
                last_name: "Dela Cruz",
                email: "juan.delacruz@agilahub.example",
                role: currentRole,
                membership_status: "active",
                chapter_or_branch: "Bantayog Elite Eagles Club",
                blood_type: bloodType,
                official_id_url: officialIdUrl,
              }
        }
        onProfileUpdated={(updated) => {
          if (updated && updated.first_name && updated.last_name) {
            if (authMember) {
              setAuthMember({
                ...authMember,
                first_name: updated.first_name,
                last_name: updated.last_name,
                phone: updated.phone ?? authMember.phone,
                chapter_or_branch: updated.chapter_or_branch ?? authMember.chapter_or_branch,
              });
            }
          }
          if (updated?.blood_type) setBloodType(updated.blood_type);
        }}
        onOpenIdScanner={() => {
          setIsProfileSettingsOpen(false);
          setIsOfficialIdScannerOpen(true);
        }}
      />

      {/* PWA Mobile Installation Prompt Banner */}
      <PwaInstallPrompt />

      {/* Magna Carta & Constitution RAG AI Modal */}
      <MagnaCartaRagModal
        isOpen={isMagnaCartaRagOpen}
        onClose={() => setIsMagnaCartaRagOpen(false)}
        initialQuery={magnaCartaInitialQuery}
      />

      {/* Supabase Realtime Live Toast Alert */}
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

      {/* Mobile Floating Bottom Bar */}
      <MobileNavBar
        activeTab={docketTab}
        onTabChange={(tab) =>
          setDocketTab(tab as "assemblies" | "ledger" | "directory" | "documents" | "community")
        }
      />
    </div>
  );
}
