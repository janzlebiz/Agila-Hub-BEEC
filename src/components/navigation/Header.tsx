"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, User, Sun, Moon, LogOut } from "lucide-react";

interface HeaderProps {
  currentRole?: "admin" | "officer" | "member";
  onRoleChange?: (role: "admin" | "officer" | "member") => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  textSize?: "normal" | "large" | "xl" | "xxl";
  onChangeTextSize?: (size: "normal" | "large" | "xl" | "xxl") => void;
  authMember?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export function Header({
  currentRole = "member",
  onRoleChange,
  isDark = false,
  onToggleTheme,
  textSize = "normal",
  onChangeTextSize,
  authMember,
  onOpenProfile,
  onLogout,
}: HeaderProps) {
  const nextTextSize = {
    normal: "large" as const,
    large: "xl" as const,
    xl: "xxl" as const,
    xxl: "normal" as const,
  }[textSize];

  // Visual styling for the single "T" icon as text size grows
  const tClassBySize = {
    normal: "text-xs font-bold text-slate-700 dark:text-slate-200",
    large: "text-sm font-extrabold text-eagle-blue dark:text-blue-400",
    xl: "text-base font-black text-eagle-blue dark:text-blue-300",
    xxl: "text-lg font-black text-amber-500 scale-110",
  }[textSize];

  return (
    <header className="sticky top-0 z-50 w-full pt-safe border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-canvas-dark/90 backdrop-blur-deep transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
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

        {/* Center / Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill (Presentation Preview) */}
          {onRoleChange && (
            <div
              className="hidden md:flex items-center bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 border border-slate-200 dark:border-white/10 text-xs font-semibold"
              title="UI Role Simulator"
            >
              <span className="px-2 text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 font-bold">
                <Shield className="h-3 w-3 text-bumblebee-yellow" /> View:
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

          {/* Text Size Scale Toggle: ONLY SHOWS LETTER T that increases in size */}
          {onChangeTextSize && (
            <button
              type="button"
              onClick={() => onChangeTextSize(nextTextSize)}
              title={`Text Size: ${textSize.toUpperCase()}. Click to enlarge.`}
              aria-label="Toggle text size"
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center justify-center transition active:scale-95 shadow-sm"
            >
              <span className={`select-none transition-all duration-200 ${tClassBySize}`}>
                T
              </span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              type="button"
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

          {/* Exactly ONE Auth / Profile Icon:
              - When NOT logged in: Link to /auth/login
              - When logged in: Profile & Settings Button */}
          {authMember ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Open Profile and Settings"
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white hover:brightness-110 flex items-center gap-2 text-xs font-bold shadow-md transition active:scale-95"
                title="Profile & Settings"
              >
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                  {authMember.first_name ? authMember.first_name.charAt(0) : "E"}
                </div>
                <span className="hidden sm:inline">
                  {authMember.first_name}
                </span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Sign Out"
                  title="Sign Out of AGILA Hub"
                  className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center justify-center transition active:scale-95 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="h-9 px-3 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white hover:brightness-110 flex items-center gap-1.5 text-xs font-bold shadow-md transition active:scale-95"
              title="Sign In / Claim ID"
            >
              <User className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
