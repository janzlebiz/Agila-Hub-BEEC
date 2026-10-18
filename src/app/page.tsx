"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { MobileNavBar } from "@/components/navigation/MobileNavBar";
import { DigitalIdCard } from "@/components/membership/DigitalIdCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<"admin" | "officer" | "member">("admin");
  const [activeTab, setActiveTab] = useState("home");
  const [checkInDone, setCheckInDone] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xl">("normal");

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

  // Dynamic profile data based on selected preview role
  const profileData = {
    admin: {
      name: "Kuya Juan Dela Cruz",
      nickname: "Juan",
      idNumber: "AGILA-2024-001",
      club: "Bantayog Elite Eagles Club",
      region: "National Executive / Bicol Region",
      status: "active" as const,
    },
    officer: {
      name: "Maria Santos",
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
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good morning,{" "}
              <span className="text-eagle-blue-dark dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-eagle-blue dark:via-blue-300 dark:to-bumblebee-yellow">
                {currentRole === "officer" ? "Ate" : "Kuya"} {profileData.nickname}!
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Welcome to the official AGILA Hub portal. You are viewing with{" "}
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
                  Paid & Verified
                </span>
              </div>
            </GlassCard>

            <GlassCard className="py-2.5 px-4 flex items-center gap-3 !rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-eagle-blue/20 flex items-center justify-center text-eagle-blue-dark dark:text-blue-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                  Next Assembly
                </span>
                <span className="text-xs font-bold text-eagle-blue-dark dark:text-blue-300">
                  In 3 Days
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
                fullName={profileData.name}
                nickname={profileData.nickname}
                memberNumber={profileData.idNumber}
                clubName={profileData.club}
                region={profileData.region}
                role={currentRole}
                status={profileData.status}
              />
            </div>

            {/* Quick Action: Live Event Check-in Card */}
            <GlassCard variant="glow-blue" className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="blue" size="sm" className="mb-2">
                    GMM CHECK-IN LIVE
                  </Badge>
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Monthly General Membership Meeting
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-eagle-blue" />
                    Agila Clubhouse & Conference Hall, QC
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-bumblebee-yellow" />
                    Today • Check-in window open
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/20">
                  <QrCode className="h-6 w-6 text-eagle-blue-dark dark:text-bumblebee-yellow" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Code: <strong className="text-slate-900 dark:text-white font-mono">AGILA-GMM-2026</strong>
                </span>
                <Button
                  size="sm"
                  variant={checkInDone ? "secondary" : "primary"}
                  onClick={() => setCheckInDone(!checkInDone)}
                >
                  {checkInDone ? "✓ Attendance Recorded" : "Self Check-in Now"}
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Col 2: Role-Tailored Workflows & System Modules */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Navigation Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GlassCard
                variant="interactive"
                className="p-4 flex flex-col items-center text-center group"
                onClick={() => setActiveTab("meetings")}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-eagle-blue/20 text-eagle-blue-dark dark:text-blue-300 group-hover:bg-eagle-blue group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Meetings</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">RSVP & History</span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className="p-4 flex flex-col items-center text-center group"
                onClick={() => setActiveTab("services")}
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-forest-light/20 text-emerald-800 dark:text-emerald-300 group-hover:bg-forest group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Contributions</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Dues & Ledger</span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className="p-4 flex flex-col items-center text-center group"
                onClick={() => setActiveTab("more")}
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-bumblebee-yellow/20 text-amber-900 dark:text-yellow-300 group-hover:bg-bumblebee-yellow group-hover:text-slate-950 transition flex items-center justify-center mb-2 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Documents</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Bylaws & Reports</span>
              </GlassCard>

              <GlassCard
                variant="interactive"
                className="p-4 flex flex-col items-center text-center group"
                onClick={() => setActiveTab("members")}
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition flex items-center justify-center mb-2 shadow-sm">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Community</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Outreach Projects</span>
              </GlassCard>
            </div>

            {/* Role-Specific Dashboard Section */}
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
                    <span>Pending Verification (1 Applicant)</span>
                    <span className="text-eagle-blue-dark dark:text-bumblebee-yellow cursor-pointer hover:underline">
                      View All
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-canvas-slate border border-slate-300 dark:border-white/20 flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs">
                        EA
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          Emilio Aguinaldo
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          applicant@agilahub.example • Cebu Chapter
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Audit Activity Snippet */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Recent RLS audit:</span>
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-bold">
                    migration_applied [20261019]
                  </span>
                  <Badge variant="green" size="sm">VERIFIED</Badge>
                </div>
              </GlassCard>
            )}

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
                      Pending Dues Verification
                    </span>
                    <span className="text-lg font-bold text-amber-700 dark:text-bumblebee-yellow mt-1 block">
                      ₱1,500.00
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      From Kuya Antonio Luna
                    </span>
                    <Button size="sm" variant="gold" className="w-full mt-3">
                      Verify Slip
                    </Button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                      Attendance Scanner
                    </span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                      42 Check-ins
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      GMM Session Active
                    </span>
                    <Button size="sm" variant="secondary" className="w-full mt-3">
                      Open Scanner
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Announcements Feed (All Roles) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-bumblebee-yellow" />
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Official Announcements
                  </h3>
                </div>
                <span className="text-xs text-eagle-blue font-bold hover:underline cursor-pointer">
                  See Archive
                </span>
              </div>

              <GlassCard variant="default" className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="red" size="sm">
                    HIGH PRIORITY
                  </Badge>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Today</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  2026 Annual National Assembly Announced
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Warm greetings fellow Agila! The 2026 Annual National Assembly is scheduled for November 28, 2026. Review the agenda and RSVP via the Events tab.
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5">
                  <span>Posted by: National Executive Secretariat</span>
                  <span className="text-eagle-blue-dark dark:text-bumblebee-yellow font-bold cursor-pointer hover:underline">
                    Read More →
                  </span>
                </div>
              </GlassCard>

              <GlassCard variant="default" className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="yellow" size="sm">
                    FINANCE
                  </Badge>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Oct 18</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Q3 Dues Remittance and Financial Reconciliation
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Reminder to all chapter treasurers: Q3 chapter remit reports are due on the 25th of this month. Please upload the validated bank slip in the Contributions module.
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bottom Bar */}
      <MobileNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
