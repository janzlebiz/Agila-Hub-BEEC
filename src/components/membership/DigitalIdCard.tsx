"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, QrCode, Sparkles, Copy, Check, X, Shield, Award } from "lucide-react";

interface DigitalIdCardProps {
  memberNumber?: string;
  fullName?: string;
  nickname?: string;
  role?: "admin" | "officer" | "member";
  status?: "active" | "pending" | "suspended" | "inactive";
  clubName?: string;
  region?: string;
  avatarUrl?: string;
}

export function DigitalIdCard({
  memberNumber = "AGILA-2024-001",
  fullName = "Kuya Juan Dela Cruz",
  nickname = "Juan",
  role = "admin",
  status = "active",
  clubName = "Bantayog Elite Eagles Club",
  region = "National Executive / Bicol Region",
}: DigitalIdCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(memberNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabels = {
    admin: "National Directorate",
    officer: "Club Officer",
    member: "Charter Member",
  };

  const statusLabels = {
    active: "Good Standing",
    pending: "Candidate Pending Review",
    suspended: "Inactive Status",
    inactive: "Alumnus",
  };

  return (
    <>
      <div className="relative w-full max-w-md mx-auto group select-none">
        {/* Ambient pearlescent aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-eagle-blue/20 via-bumblebee-yellow/25 to-forest-light/20 dark:from-eagle-blue/30 dark:via-bumblebee-yellow/20 dark:to-forest-light/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 -z-10" />

        {/* Polycarbonate Physical Card Base */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-300/90 dark:border-white/15 bg-gradient-to-b from-white via-slate-50/95 to-slate-100/90 dark:from-canvas-slate dark:via-[#0c1424] dark:to-canvas-dark p-6 shadow-2xl transition-all">
          
          {/* Guilloché / Security Watermark Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #05379E 1px, transparent 1px), radial-gradient(circle at 0% 100%, #FEC201 1px, transparent 1px)`,
              backgroundSize: "16px 16px, 24px 24px"
            }}
          />

          {/* Top Edge Metallic Micro-Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Top Header: Official Seals & Fraternal Affiliation */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              {/* AGILA Hub Official Insignia */}
              <div className="relative h-12 w-12 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-slate-200/90 dark:border-white/20">
                <Image
                  src="/assets/AGILA Hub.png"
                  alt="AGILA Hub Official Logo"
                  width={42}
                  height={42}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    AGILA Hub
                  </span>
                  <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold tracking-wide bg-amber-100/80 dark:bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-400/20">
                    Official Credential
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  The Fraternal Order of Eagles
                </p>
              </div>
            </div>

            {/* Bantayog Elite Crest Badge with Gold Foil Border */}
            <div className="relative h-12 w-12 rounded-xl bg-slate-900 p-1 shadow-md border border-amber-400/60 shrink-0 overflow-hidden flex items-center justify-center">
              <Image
                src="/assets/BEEC_vector.png"
                alt="Bantayog Elite Eagles Club Crest"
                width={44}
                height={44}
                className="object-contain scale-105"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Center: Member Profile & Smart Security Elements */}
          <div className="relative z-10 py-5 flex items-start gap-4">
            {/* Avatar Frame with Gold Contact Chip Motif */}
            <div className="relative h-20 w-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 shrink-0 shadow-lg">
              <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center overflow-hidden border border-white dark:border-white/20">
                <span className="font-display text-2xl font-black text-slate-900 dark:text-white">
                  {nickname.charAt(0)}
                </span>
              </div>
              {/* Online Verified Seal */}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-canvas-dark border-2 border-white dark:border-canvas-dark flex items-center justify-center shadow">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Member Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={role === "admin" ? "gold" : role === "officer" ? "blue" : "neutral"} size="sm">
                  <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  {roleLabels[role]}
                </Badge>
                <Badge variant={status === "active" ? "green" : "yellow"} size="sm">
                  {statusLabels[status]}
                </Badge>
              </div>

              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                {fullName}
              </h3>
              <p className="text-xs text-eagle-blue-dark dark:text-amber-300 font-bold mt-0.5">
                {clubName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {region}
              </p>
            </div>
          </div>

          {/* Bottom Bar: Secure RFID & QR Passcode Trigger */}
          <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase block">
                Official Member ID
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="group/id inline-flex items-center gap-1.5 font-mono text-sm font-black text-slate-900 dark:text-white hover:text-eagle-blue dark:hover:text-amber-300 transition-colors mt-0.5"
                title="Click to copy official Member ID"
              >
                <span>{memberNumber}</span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400 group-hover/id:text-slate-700 dark:group-hover/id:text-white" />
                )}
              </button>
            </div>

            {/* Interactive QR Passcode & Latin Motto */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end">
                <span className="font-serif italic text-[11px] text-slate-600 dark:text-slate-300 font-semibold tracking-wide">
                  Deo Et Patria
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Verified Pass
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                title="Tap to show high-resolution verification QR code"
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer transition shadow-sm active:scale-95 group/qr"
              >
                <QrCode className="h-6 w-6 text-slate-800 dark:text-white group-hover/qr:scale-110 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution QR Event Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 mb-3">
              <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Official Verification Pass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Present this pass to the Secretariat during General Membership Assemblies or Chapter Events.
            </p>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-inner flex flex-col items-center justify-center mx-auto mb-4">
              <QrCode className="h-40 w-40 text-slate-900" />
              <span className="font-mono font-bold text-xs text-slate-800 mt-2">
                {memberNumber}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              {fullName} • {clubName}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </>
  );
}
