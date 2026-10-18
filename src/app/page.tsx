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
  ExternalLink,
  ChevronRight,
  Landmark,
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

  const [currentRole, setCurrentRole] = useState<"admin" | "officer" | "member">("admin");
  const [docketTab, setDocketTab] = useState<"assemblies" | "ledger" | "documents" | "community">("assemblies");
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

  // Interactive Live Check-in States
  const [checkInCode, setCheckInCode] = useState("AGILA-GMM-2026");
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

      // 6. Fetch Pending Applicants
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

  // Active check-in assembly
  const activeEvent = events.find((e) => e.checkin_open) || events[0];

  // Total verified dues calculation
  const totalVerifiedDues = contributions
    .filter((c) => c.status === "verified")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  // Handle Tactile Check-In
  const handleCheckIn = async (eventId: string) => {
    if (!checkInCode.trim()) return;
    setCheckInLoading(true);
    setCheckInFeedback(null);
    try {
      const { data, error } = await supabase.rpc("check_in_event", {
        p_event_id: eventId,
        p_checkin_code: checkInCode.trim().toUpperCase(),
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
    <div className="min-h-screen flex flex-col pb-24 sm:pb-12 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Top Glass Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        textSize={textSize}
        onChangeTextSize={setTextSize}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Fraternal Greeting Section (Natural Voice, No Single-word Accent Splits) */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Mabuhay ang Agila!
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {activeProfile.club}
              </span>
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

              {/* The Physical Executive Polycarbonate Credential */}
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

            {/* Tactile Assembly Check-In Card */}
            {activeEvent && (
              <GlassCard variant="glow-blue" className="p-5 shadow-lg border-eagle-blue/20">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={activeEvent.checkin_open ? "blue" : "neutral"} size="sm" className="mb-2">
                      {activeEvent.checkin_open ? "Assembly Quorum Open" : "Upcoming Meeting"}
                    </Badge>
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
              </GlassCard>
            )}
          </div>

          {/* Col 2: The Fraternal Action Docket & Circulars */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* The Unified Fraternal Action Docket (Replaced generic 4 square tiles) */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-canvas-slate/80 backdrop-blur-deep p-2 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100/80 dark:bg-white/[0.05] rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDocketTab("assemblies")}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                    docketTab === "assemblies"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-eagle-blue" />
                  <span>Assemblies ({events.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("ledger")}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                    docketTab === "ledger"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Ledger (₱{totalVerifiedDues.toLocaleString()})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("documents")}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                    docketTab === "documents"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span>Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocketTab("community")}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                    docketTab === "community"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <HeartHandshake className="h-3.5 w-3.5 text-purple-500" />
                  <span>Outreach</span>
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Fraternal Dues & Contribution Records
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Audited Secretariat Balance
                      </span>
                    </div>

                    {contributions.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {c.title.replace("[SEED] ", "")}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {c.category} • Method: {c.payment_method} {c.reference_number ? `(${c.reference_number})` : ""}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                            ₱{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                              c.status === "verified"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. DOCUMENT VAULT TAB */}
                {docketTab === "documents" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
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
                            <Download className="h-3.5 w-3.5" /> PDF
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

      {/* Mobile Floating Bottom Bar */}
      <MobileNavBar activeTab={docketTab} onTabChange={(tab) => setDocketTab(tab as "assemblies" | "ledger" | "documents" | "community")} />
    </div>
  );
}
