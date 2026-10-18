"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Shield, User } from "lucide-react";

interface HeaderProps {
  currentRole?: "admin" | "officer" | "member";
  onRoleChange?: (role: "admin" | "officer" | "member") => void;
}

export function Header({ currentRole = "admin", onRoleChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-canvas-dark/75 backdrop-blur-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 rounded-xl bg-white/95 p-1 shadow-glass flex items-center justify-center shrink-0 border border-white/30 group-hover:scale-105 transition">
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
              <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-eagle-blue transition">
                AGILA<span className="text-eagle-blue font-bold">Hub</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-bumblebee-yellow inline-block" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              TFOE-PE, Inc.
            </span>
          </div>
        </Link>

        {/* Right Section: Role Simulator & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher Pill for Development & Live Demonstration */}
          {onRoleChange && (
            <div className="hidden sm:flex items-center bg-white/[0.06] rounded-xl p-1 border border-white/10 text-xs font-semibold">
              <span className="px-2 text-slate-400 text-[11px] flex items-center gap-1">
                <Shield className="h-3 w-3 text-bumblebee-yellow" /> Role:
              </span>
              {(["admin", "officer", "member"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    currentRole === r
                      ? "bg-eagle-blue text-white shadow-glow-blue font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Notification Bell */}
          <button
            aria-label="Notifications"
            className="relative h-9 w-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition active:scale-95"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-bumblebee-yellow shadow-glow-yellow" />
          </button>

          {/* User Avatar */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-eagle-blue to-forest-light p-0.5 shadow-glass">
            <div className="h-full w-full rounded-[10px] bg-canvas-slate flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
