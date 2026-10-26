"use client";

import React from "react";
import Image from "next/image";
import { X, User, Phone, MapPin, Calendar, ShieldCheck, Mail, Building, Lock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isSameMemberId } from "@/lib/financeUtils";

export interface MemberDetailItem {
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
  blood_type?: string | null;
  avatar_url?: string | null;
  joined_date?: string | null;
}

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberDetailItem | null;
  currentUserRole?: "admin" | "officer" | "member";
  currentUserId?: string | null;
}

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length <= 6) return "••••••";
  return clean.slice(0, 6) + " ••• ••" + clean.slice(-2);
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "••••@••••";
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : "••";
  return `${maskedName}@${domain}`;
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  currentUserRole = "member",
  currentUserId,
}: MemberDetailModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const isOfficerOrAdmin = currentUserRole === "admin" || currentUserRole === "officer";
  const isSelf = Boolean(
    (currentUserId && member.id === currentUserId) ||
    (currentUserId && isSameMemberId(currentUserId, member.id))
  );
  const canViewPrivateContact = isOfficerOrAdmin || isSelf;

  const roleLabels = {
    admin: "Club President / Directorate",
    officer: "Club Officer",
    member: "Charter Member",
  };

  const statusLabels = {
    active: "Good Standing (Active)",
    pending: "Pending Verification",
    suspended: "Suspended",
    inactive: "Inactive",
  };

  const isNationalRoster = member.member_number?.toUpperCase().startsWith("AGILA-");
  const isCharteredClub = member.member_number?.toUpperCase().startsWith("BEEC-");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          data-close-modal="true"
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Member Header Profile */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 p-0.5 shadow-md mb-3">
            <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-dark flex items-center justify-center overflow-hidden">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.first_name}
                  width={80}
                  height={80}
                  className="object-cover h-full w-full"
                  unoptimized
                />
              ) : (
                <span className="font-display font-black text-2xl text-slate-800 dark:text-white">
                  {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap justify-center">
            <Badge variant={member.role === "admin" ? "gold" : member.role === "officer" ? "blue" : "neutral"} size="sm">
              <ShieldCheck className="h-3 w-3 mr-1 text-amber-500" />
              {roleLabels[member.role] || "Member"}
            </Badge>
            <Badge variant={member.membership_status === "active" ? "green" : member.membership_status === "suspended" ? "red" : "yellow"} size="sm">
              {statusLabels[member.membership_status] || "Active"}
            </Badge>
            {isNationalRoster && (
              <Badge variant="blue" size="sm">
                National Roster
              </Badge>
            )}
            {isCharteredClub && (
              <Badge variant="gold" size="sm">
                Chartered Club
              </Badge>
            )}
          </div>

          <h3
            id="member-modal-title"
            className="font-display font-black text-lg text-slate-900 dark:text-white"
          >
            Kuya {member.first_name} {member.last_name}
          </h3>
          <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {member.member_number || "Not Assigned"}
          </p>
        </div>

        {/* Details Grid */}
        <div className="py-4 space-y-3 overflow-y-auto text-xs">
          {/* Privacy Protection Notice for Non-Officers */}
          {!canViewPrivateContact && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-eagle-blue dark:text-blue-400 shrink-0" />
              <span>Private Contact Details Protected (Visible to club officers & self only)</span>
            </div>
          )}

          {/* Full Name & Classification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <User className="h-4 w-4 text-eagle-blue shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Name & Classification
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {member.first_name} {member.last_name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Classification: {roleLabels[member.role]} • Status: {statusLabels[member.membership_status]}
              </span>
            </div>
          </div>

          {/* Mobile Number (Protected if regular member viewing peer) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Phone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mobile Number {canViewPrivateContact ? "" : "(Protected)"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {member.phone ? (canViewPrivateContact ? member.phone : maskPhone(member.phone)) : "Not provided"}
              </span>
            </div>
          </div>

          {/* Email Address (Protected if regular member viewing peer) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Mail className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Email {canViewPrivateContact ? "" : "(Protected)"}
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-white text-xs">
                {member.email ? (canViewPrivateContact ? member.email : maskEmail(member.email)) : "Not provided"}
              </span>
            </div>
          </div>

          {/* Organizational Affiliation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Building className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Organizational Affiliation & Chapter
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {member.chapter_or_branch || "Bantayog Elite Eagles Club"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {isNationalRoster
                  ? "National Roster Entry • Metro Manila Affiliation"
                  : "Chartered Local Chapter • Bicol Camarines Norte Bantayog Region 1"}
              </span>
            </div>
          </div>

          {/* Address (No fabricated placeholders) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Residential / Business Address
              </span>
              <span className="font-medium text-slate-900 dark:text-white text-xs leading-relaxed">
                {member.address || "Not specified in official records"}
              </span>
            </div>
          </div>

          {/* Birthday & Blood Type (No fabricated placeholders) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Birthday
              </span>
              <span className="font-medium text-slate-900 dark:text-white text-xs block mt-0.5">
                {member.birthday
                  ? new Date(member.birthday).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Not recorded"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Blood Type
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                {member.blood_type || "Not recorded"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs font-bold w-full">
            Close Member Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

