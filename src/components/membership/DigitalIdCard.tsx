"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, QrCode, Sparkles, Copy, Check } from "lucide-react";

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

  const handleCopyId = () => {
    navigator.clipboard.writeText(memberNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto group">
      {/* Outer ambient liquid refraction glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-eagle-blue/30 via-bumblebee-yellow/40 to-forest-light/30 dark:from-eagle-blue dark:via-bumblebee-yellow/40 dark:to-forest-light/50 rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-1000 -z-10 animate-pulse-slow" />

      {/* Main Glass Card container */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-300/80 dark:border-white/20 bg-gradient-to-b from-white/95 via-slate-50/90 to-white/95 dark:from-canvas-slate/90 dark:via-canvas-card/85 dark:to-canvas-dark/95 backdrop-blur-deep p-6 shadow-xl dark:shadow-2xl transition-colors">
        {/* Subtle holographic sheen overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 dark:from-white/[0.12] via-transparent to-transparent pointer-events-none" />

        {/* Top Header: Official Logos & Association */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            {/* AGILA Hub Official Logo */}
            <div className="relative h-12 w-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/30">
              <Image
                src="/assets/AGILA Hub.png"
                alt="AGILA Hub Official Logo"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base tracking-wide text-slate-900 dark:text-white">
                  AGILA HUB
                </span>
                <span className="text-[10px] text-amber-800 dark:text-bumblebee-yellow font-bold uppercase tracking-wider bg-amber-50 dark:bg-bumblebee-yellow/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-bumblebee-yellow/20">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                The Fraternal Order of Eagles
              </p>
            </div>
          </div>

          {/* Club Crest Logo (BEEC) */}
          <div className="relative h-12 w-12 rounded-xl bg-slate-900 p-0.5 shadow-md border border-bumblebee-gold/50 shrink-0 overflow-hidden flex items-center justify-center">
            <Image
              src="/assets/BEEC_vector.png"
              alt="Bantayog Elite Eagles Club Crest"
              width={46}
              height={46}
              className="object-contain scale-105"
            />
          </div>
        </div>

        {/* Center: Member Profile Details */}
        <div className="relative z-10 py-5 flex items-start gap-4">
          {/* Avatar Profile Photo Frame */}
          <div className="relative h-20 w-20 rounded-2xl p-1 bg-gradient-to-tr from-bumblebee-yellow via-eagle-blue to-forest-light shrink-0 shadow-md">
            <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center overflow-hidden border border-white/60 dark:border-white/20">
              <span className="font-display text-2xl font-black text-eagle-blue-dark dark:text-white/90">
                {nickname.charAt(0)}
              </span>
            </div>
            {/* Status dot indicator */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-canvas-dark border-2 border-white dark:border-canvas-dark flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-forest-light animate-pulse" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={role === "admin" ? "gold" : role === "officer" ? "blue" : "neutral"} size="sm">
                <ShieldCheck className="h-3 w-3" />
                {role.toUpperCase()}
              </Badge>
              <Badge variant={status === "active" ? "green" : "yellow"} size="sm">
                {status.toUpperCase()}
              </Badge>
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate leading-tight">
              {fullName}
            </h3>
            <p className="text-xs text-eagle-blue-dark dark:text-bumblebee-yellow font-semibold mt-0.5">
              {clubName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {region}
            </p>
          </div>
        </div>

        {/* Bottom Bar: ID & QR Code Box */}
        <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Membership ID Number
            </span>
            <button
              onClick={handleCopyId}
              className="group/id inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900 dark:text-white hover:text-eagle-blue dark:hover:text-bumblebee-yellow transition-colors mt-0.5"
            >
              <span>{memberNumber}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-forest-light" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover/id:text-slate-700 dark:group-hover/id:text-white" />
              )}
            </button>
          </div>

          {/* Touch QR Trigger */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Deo Et Patria</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5" /> VERIFIED
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer transition shadow-sm active:scale-95">
              <QrCode className="h-5 w-5 text-slate-800 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Decorative corner accent badge */}
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-eagle-blue/10 dark:bg-bumblebee-yellow/10 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
}
