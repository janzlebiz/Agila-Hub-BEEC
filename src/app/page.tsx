"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

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

  const [currentRole, setCurrentRole] = useState<"admin" | "officer" | "member">("admin");
  const [activeTab, setActiveTab] = useState("home");
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xl">("normal");

  // Live Database States
  const [loading, setLoading] = useState(true);
  const [authMember, setAuthMember] = useState<MemberRecord | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<MemberRecord[]>([]);

  // Interactive Live Actions
  const [checkInInput, setCheckInInput] = useState("AGILA-GMM-2026");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Sync theme and text size to root html element
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

      // 1. Check Authenticated Session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: memberData } = await supabase
          .from("members")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          setAuthMember(memberData as MemberRecord);
          setCurrentRole(memberData.role as "admin" | "officer" | "member");
        }
      }

      // 2. Fetch Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (annData) setAnnouncements(annData as AnnouncementRecord[]);

      // 3. Fetch Events
      const { data: evtData } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (evtData) setEvents(evtData as EventRecord[]);

      // 4. Fetch Contributions
      const { data: contData } = await supabase
        .from("contributions")
        .select("*")
        .order("contribution_date", { ascending: false });

      if (contData) setContributions(contData as ContributionRecord[]);

      // 5. Fetch Documents
      const { data: docData } = await supabase
        .from("documents")
        .select("*")
        .order("category", { ascending: true });

      if (docData) setDocuments(docData as DocumentRecord[]);

      // 6. Fetch Pending Applicants (for Admin/Officer view)
      const { data: pendData } = await supabase
        .from("members")
        .select("*")
        .eq("membership_status", "pending");

      if (pendData) setPendingApplicants(pendData as MemberRecord[]);
    } catch (err) {
      console.error("Error fetching live database data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  // Profile data displayed on Digital ID
  const activeProfile = authMember
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

  // Live active check-in event
  const activeEvent = events.find((e) => e.checkin_open) || events[0];

  // Handle Live Check-In RPC
  const handleCheckIn = async (eventId: string) => {
    setCheckInLoading(true);
    setCheckInFeedback(null);
    try {
      const { data, error } = await supabase.rpc("check_in_event", {
        p_event_id: eventId,
        p_checkin_code: checkInInput.trim(),
      });

      if (error) {
        setCheckInFeedback({ success: false, message: error.message });
      } else {
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

  // Handle Applicant Approval RPC
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
    <div className="min-h-screen flex flex-col pb-24 sm:pb-12 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Top Glass Header with Brand, Role Selector, Theme Toggle, Text Size Scale */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        textSize={textSize}
        onChangeTextSize={setTextSize}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Mobile Greeting Banner & Controls */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-eagle-blue-dark dark:text-bumblebee-yellow uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-forest-light animate-pulse" />
                Mabuhay ang Agila!
              </span>
              <Badge variant="blue" size="sm">
                LIVE POSTGRES DB
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good day,{" "}
              <span className="text-eagle-blue-dark dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-eagle-blue dark:via-blue-300 dark:to-bumblebee-yellow">
                {activeProfile.name}!
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Welcome to the authoritative AGILA Hub portal. Viewing with{" "}
              <span className="text-eagle-blue font-bold uppercase">{currentRole}</span> permissions.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 flex-wrap">
            <GlassCard className="py-2.5 px-4 flex items-center gap-3 !rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-forest-light/20 flex items-center justify-center text-emerald-700 dark:text-forest-light">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                  Dues Status
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {contributions.some((c) => c.status === "verified") ? "Paid & Verified" : "Pending Ledger"}
                </span>
              </div>
            </GlassCard>

            <GlassCard className="py-2.5 px-4 flex items-center gap-3 !rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-eagle-blue/20 flex items-center justify-center text-eagle-blue-dark dark:text-blue-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                  Events Scheduled
                </span>
                <span className="text-xs font-bold text-eagle-blue-dark dark:text-blue-300">
                  {events.length} Upcoming
                </span>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Layout Grid: Left = Digital ID Card / Right = Active Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Col 1: Digital ID Card & Quick Attendance */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                  Digital Membership Card
                </span>
                <span className="text-[11px] text-eagle-blue-dark dark:text-bumblebee-yellow font-bold flex items-center gap-1">
                  Tap for QR Verification
                </span>
              </div>

              {/* The Official Digital ID Card */}
              <DigitalIdCard
                fullName={activeProfile.name}
                nickname={activeProfile.nickname}
                memberNumber={activeProfile.idNumber}
                clubName={activeProfile.club}
                region={activeProfile.region}
                role={currentRole}
                status={activeProfile.status}
              />
            </div>

            {/* Quick Action: Live Event Check-in Card */}
            {activeEvent && (
              <GlassCard variant="glow-blue" className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={activeEvent.checkin_open ? "blue" : "neutral"} size="sm" className="mb-2">
                      {activeEvent.checkin_open ? "LIVE CHECK-IN WINDOW" : "UPCOMING ASSEMBLY"}
                    </Badge>
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      {activeEvent.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-eagle-blue" />
                      {activeEvent.location || "Agila Clubhouse & Conference Hall, QC"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-bumblebee-yellow" />
                      Scheduled: {new Date(activeEvent.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/20">
                    <QrCode className="h-6 w-6 text-eagle-blue-dark dark:text-bumblebee-yellow" />
                  </div>
                </div>

                {checkInFeedback && (
                  <div
                    className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium animate-fadeIn ${
                      checkInFeedback.success
                        ? "bg-forest-green/10 border-forest-green/30 text-forest-green dark:text-forest-light"
                        : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {checkInFeedback.success ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{checkInFeedback.message}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">PIN:</span>
                    <input
                      type="text"
                      value={checkInInput}
                      onChange={(e) => setCheckInInput(e.target.value)}
                      placeholder="PIN Code"
                      className="h-8 px-2.5 w-36 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-eagle-blue"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={checkInFeedback?.success ? "secondary" : "primary"}
                    disabled={checkInLoading}
                    onClick={() => handleCheckIn(activeEvent.id)}
                  >
                    {checkInLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : checkInFeedback?.success ? (
                      "✓ Check-in Verified"
                    ) : (
                      "Record Attendance"
                    )}
                  </Button>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Col 2: Role-Tailored Workflows & System Modules */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Navigation Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GlassCard
                variant="interactive"
                className={`p-4 flex flex-col items-center text-center group ${
                  activeTab === "meetings" ? "ring-2 ring-eagle-blue bg-white/95 dark:bg-white/10" : ""
                }`}
                onClick={() => setActiveTab(activeTab === "meetings" ? "home" : "meetings")}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-eagle-blue/20 text-eagle-blue-dark dark:text-blue-300 group-hover:bg-eagle-blue group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Meetings</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {events.length} Events
                </span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className={`p-4 flex flex-col items-center text-center group ${
                  activeTab === "contributions" ? "ring-2 ring-forest-light bg-white/95 dark:bg-white/10" : ""
                }`}
                onClick={() => setActiveTab(activeTab === "contributions" ? "home" : "contributions")}
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-forest-light/20 text-emerald-800 dark:text-emerald-300 group-hover:bg-forest group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Contributions</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  ₱{contributions.reduce((acc, c) => acc + Number(c.amount), 0).toLocaleString()} Dues
                </span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className={`p-4 flex flex-col items-center text-center group ${
                  activeTab === "documents" ? "ring-2 ring-bumblebee-yellow bg-white/95 dark:bg-white/10" : ""
                }`}
                onClick={() => setActiveTab(activeTab === "documents" ? "home" : "documents")}
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-bumblebee-yellow/20 text-amber-900 dark:text-yellow-300 group-hover:bg-bumblebee-yellow group-hover:text-slate-950 transition flex items-center justify-center mb-2 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Documents</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {documents.length} Bylaws/Vault
                </span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className={`p-4 flex flex-col items-center text-center group ${
                  activeTab === "community" ? "ring-2 ring-purple-500 bg-white/95 dark:bg-white/10" : ""
                }`}
                onClick={() => setActiveTab(activeTab === "community" ? "home" : "community")}
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Community</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Outreach</span>
              </GlassCard>
            </div>

            {/* TAB VIEW: MEETINGS */}
            {activeTab === "meetings" && (
              <GlassCard variant="elevated" className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-eagle-blue" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Official Meetings & Assemblies
                    </h3>
                  </div>
                  <Badge variant="blue" size="sm">
                    {events.length} Records in Database
                  </Badge>
                </div>
                <div className="space-y-3">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {evt.title.replace("[SEED] ", "")}
                          </span>
                          {evt.checkin_open && <Badge variant="green" size="sm">CHECK-IN OPEN</Badge>}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {evt.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                          <span>📍 {evt.location || "QC Clubhouse"}</span>
                          <span>📅 {new Date(evt.event_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setCheckInInput(evt.checkin_code || "");
                            setActiveTab("home");
                          }}
                        >
                          Check In Code: {evt.checkin_code}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* TAB VIEW: CONTRIBUTIONS */}
            {activeTab === "contributions" && (
              <GlassCard variant="elevated" className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-forest-light" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Dues & Contribution Ledger
                    </h3>
                  </div>
                  <Badge variant="green" size="sm">
                    POSTGRES FINANCIAL LEDGER
                  </Badge>
                </div>
                <div className="space-y-3">
                  {contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {c.title.replace("[SEED] ", "")}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.category} • Method: {c.payment_method} • Date: {c.contribution_date}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                          ₱{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={c.status === "verified" ? "green" : "yellow"} size="sm">
                          {c.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* TAB VIEW: DOCUMENTS */}
            {activeTab === "documents" && (
              <GlassCard variant="elevated" className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-bumblebee-yellow" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Official Document Vault
                    </h3>
                  </div>
                  <Badge variant="gold" size="sm">
                    RLS PROTECTED
                  </Badge>
                </div>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {doc.title.replace("[SEED] ", "")}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {doc.description || "Official ratified document"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Role-Specific Dashboard Section: Admin Approvals */}
            {currentRole === "admin" && (
              <GlassCard variant="elevated" className="space-y-4 border-amber-300 dark:border-bumblebee-yellow/20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-bumblebee-yellow" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Executive Admin Portal
                    </h3>
                  </div>
                  <Badge variant="gold" size="sm">
                    SUPERADMIN ACCESS
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Authoritative controls for membership authorizations, officer role assignments, and system audit logs.
                </p>

                {/* Pending Membership Approvals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold px-1">
                    <span>Pending Verification ({pendingApplicants.length} Applicant{pendingApplicants.length === 1 ? "" : "s"})</span>
                    <span className="text-eagle-blue-dark dark:text-bumblebee-yellow cursor-pointer hover:underline">
                      Live Directory
                    </span>
                  </div>

                  {pendingApplicants.length === 0 ? (
                    <div className="p-4 rounded-xl bg-forest-green/10 border border-forest-green/30 text-xs text-forest-green dark:text-forest-light flex items-center gap-2">
                      <Check className="h-4 w-4" /> All membership applicants verified and active.
                    </div>
                  ) : (
                    pendingApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-canvas-slate border border-slate-300 dark:border-white/20 flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs">
                            {applicant.first_name[0]}
                            {applicant.last_name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white block">
                              {applicant.first_name} {applicant.last_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {applicant.email} • {applicant.chapter_or_branch || "Chapter Applicant"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={approvingId === applicant.id}
                            onClick={() => handleApproveApplicant(applicant.id)}
                          >
                            {approvingId === applicant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Audit Activity Snippet */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Database State:</span>
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-bold">
                    Connected to remote PostgreSQL
                  </span>
                  <Badge variant="green" size="sm">LIVE SYNC</Badge>
                </div>
              </GlassCard>
            )}

            {/* Role-Specific Dashboard Section: Officer View */}
            {currentRole === "officer" && (
              <GlassCard variant="elevated" className="space-y-4 border-eagle-blue/30">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-eagle-blue" />
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Club Officer Console
                    </h3>
                  </div>
                  <Badge variant="blue" size="sm">
                    OFFICER TIER
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                      Total Ledger Dues
                    </span>
                    <span className="text-lg font-bold text-amber-700 dark:text-bumblebee-yellow mt-1 block font-mono">
                      ₱{contributions.reduce((acc, c) => acc + Number(c.amount), 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      {contributions.length} Recorded Transactions
                    </span>
                    <Button
                      size="sm"
                      variant="gold"
                      className="w-full mt-3"
                      onClick={() => setActiveTab("contributions")}
                    >
                      View Ledger
                    </Button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                      Active Assemblies
                    </span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                      {events.filter((e) => e.checkin_open).length} Check-in Open
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      GMM Code: {activeEvent?.checkin_code || "AGILA-2026"}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-3"
                      onClick={() => setActiveTab("meetings")}
                    >
                      Open Events
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Announcements Feed (All Roles - Live from Database) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-bumblebee-yellow" />
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Official Announcements
                  </h3>
                </div>
                <span className="text-xs text-eagle-blue font-bold">
                  {announcements.length} Published
                </span>
              </div>

              {announcements.length === 0 ? (
                <GlassCard variant="default" className="p-4 text-center text-xs text-slate-500">
                  No published announcements found in database.
                </GlassCard>
              ) : (
                announcements.map((ann) => (
                  <GlassCard key={ann.id} variant="default" className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          ann.priority === "urgent" || ann.priority === "high"
                            ? "red"
                            : ann.category === "Finance"
                            ? "yellow"
                            : "blue"
                        }
                        size="sm"
                      >
                        {ann.priority.toUpperCase()} • {ann.category.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : "Active"}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {ann.title.replace("[SEED] ", "")}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {ann.content}
                    </p>
                  </GlassCard>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bottom Bar */}
      <MobileNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
