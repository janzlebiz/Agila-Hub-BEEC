"use client";

import React from "react";
import Image from "next/image";
import { X, User, Phone, MapPin, Calendar, ShieldCheck, Mail, Droplet, Building } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
}

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberDetailItem | null;
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
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

  const roleLabels = {
    admin: "Club President / Directorate",
    officer: "Club Officer",
    member: "Charter Member",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          data-close-modal="true"
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300"
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

          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge variant={member.role === "admin" ? "gold" : member.role === "officer" ? "blue" : "neutral"} size="sm">
              <ShieldCheck className="h-3 w-3 mr-1 text-amber-500" />
              {roleLabels[member.role]}
            </Badge>
            <Badge variant={member.membership_status === "active" ? "green" : "yellow"} size="sm">
              {member.membership_status === "active" ? "Good Standing" : "Pending Candidate"}
            </Badge>
          </div>

          <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
            Kuya/Ate {member.first_name} {member.last_name}
          </h3>
          <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {member.member_number || "BEEC-MEMBER"}
          </p>
        </div>

        {/* Details Grid */}
        <div className="py-4 space-y-3 overflow-y-auto text-xs">
          {/* Full Name */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <User className="h-4 w-4 text-eagle-blue shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Full Name
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {member.first_name} {member.last_name}
              </span>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Phone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mobile Number
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {member.phone || "Not provided"}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Address
              </span>
              <span className="font-medium text-slate-900 dark:text-white text-xs leading-relaxed">
                {member.address || "Daet, Camarines Norte, Bicol Region, Philippines"}
              </span>
            </div>
          </div>

          {/* Birthday */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Calendar className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Birthday
              </span>
              <span className="font-medium text-slate-900 dark:text-white text-xs">
                {member.birthday
                  ? new Date(member.birthday).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "June 22 (Official Fraternity Founding)"}
              </span>
            </div>
          </div>

          {/* Club & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Club
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate block mt-0.5">
                {member.chapter_or_branch || "Bantayog Elite Eagles Club"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Blood Type
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                {member.blood_type || "O+"}
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
