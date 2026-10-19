"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Shield, User, Sun, Moon, Type } from "lucide-react";

interface HeaderProps {
  currentRole?: "admin" | "officer" | "member";
  onRoleChange?: (role: "admin" | "officer" | "member") => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  textSize?: "normal" | "large" | "xl";
  onChangeTextSize?: (size: "normal" | "large" | "xl") => void;
  authMember?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  onOpenProfile?: () => void;
}

export function Header({
  currentRole = "admin",
  onRoleChange,
  isDark = false,
  onToggleTheme,
  textSize = "normal",
  onChangeTextSize,
  authMember,
  onOpenProfile,
}: HeaderProps) {
  const nextTextSize = {
    normal: "large" as const,
    large: "xl" as const,
    xl: "normal" as const,
  }[textSize];

  const textSizeLabels = {
    normal: "100%",
    large: "112%",
    xl: "125%",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-canvas-dark/80 backdrop-blur-deep transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/30 group-hover:scale-105 transition">
            <Image
              src="/assets/AGILA Hub.png"
              alt="AGILA Hub"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-eagle-blue transition">
                AGILA Hub
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-bumblebee-yellow inline-block" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">
              TFOE-PE, Inc.
            </span>
          </div>
        </Link>

        {/* Center / Right Section: Accessibility, Theme & Role Simulator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill */}
          {onRoleChange && (
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 border border-slate-200 dark:border-white/10 text-xs font-semibold">
              <span className="px-2 text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 font-bold">
                <Shield className="h-3 w-3 text-bumblebee-yellow" /> Role:
              </span>
              {(["admin", "officer", "member"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    currentRole === r
                      ? "bg-eagle-blue text-white shadow-md font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Text Size Scale Display & Toggle */}
          {onChangeTextSize && (
            <button
              onClick={() => onChangeTextSize(nextTextSize)}
              title={`Text Size: ${textSize.toUpperCase()} (${textSizeLabels[textSize]}). Click to cycle.`}
              className="h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm"
            >
              <Type className="h-3.5 w-3.5 text-eagle-blue" />
              <span className="font-mono text-[11px]">{textSizeLabels[textSize]}</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-bumblebee-yellow animate-spin-slow" />
              ) : (
                <Moon className="h-4 w-4 text-eagle-blue-dark" />
              )}
            </button>
          )}

          {/* Notification Bell */}
          <button
            aria-label="Notifications"
            className="relative h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-bumblebee-yellow shadow-sm" />
          </button>

          {/* Profile & Credentials Settings Quick Trigger */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Profile and Security Settings"
              title="Open Member Profile & Security Settings"
              className="h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm"
            >
              <User className="h-4 w-4 text-eagle-blue" />
              <span className="hidden lg:inline text-[11px]">Profile & ID</span>
            </button>
          )}

          {/* Auth Action: Profile Settings when logged in or Sign In */}
          {authMember ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="h-9 px-3 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white hover:brightness-110 flex items-center gap-2 text-xs font-bold shadow-md transition active:scale-95"
              title="Open Member Profile & Security Settings"
            >
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                {authMember.first_name.charAt(0)}
              </div>
              <span className="hidden sm:inline">
                {authMember.first_name} ({authMember.role})
              </span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="h-9 px-3 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white hover:brightness-110 flex items-center gap-1.5 text-xs font-bold shadow-md transition active:scale-95"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign In / Claim ID</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
