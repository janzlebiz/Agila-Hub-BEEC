"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  X,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Landmark,
  IdCard,
} from "lucide-react";

export interface DirectoryMember {
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
  official_id_url?: string | null;
  id_card_back_url?: string | null;
  blood_type?: string | null;
  avatar_url?: string | null;
  joined_date?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

interface MemberDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: DirectoryMember[];
  onSelectMember?: (member: DirectoryMember) => void;
}

export function MemberDirectoryModal({
  isOpen,
  onClose,
  members,
  onSelectMember,
}: MemberDirectoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "officer" | "member">("all");

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const memberNum = (m.member_number || "").toLowerCase();
    const chapter = (m.chapter_or_branch || "").toLowerCase();
    const matchesSearch = fullName.includes(term) || memberNum.includes(term) || chapter.includes(term);
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-eagle-blue flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                Membership Directory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The Fraternal Order of Eagles • Bantayog Elite Eagles Club
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="py-4 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Kuya name, Member ID (e.g. 019528), or club..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Role:
            </span>
            {(["all", "admin", "officer", "member"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl capitalize transition shrink-0 ${
                  roleFilter === r
                    ? "bg-eagle-blue text-white shadow-sm"
                    : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                {r === "all" ? "All Ranks" : r === "admin" ? "National Directorate" : r === "officer" ? "Club Officers" : "Charter Members"}
              </button>
            ))}
          </div>
        </div>

        {/* Members Roster List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
              No fraternal members matched your search criteria.
            </div>
          ) : (
            filteredMembers.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-eagle-blue/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 p-0.5 shrink-0 shadow-sm">
                    <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center font-bold text-sm text-slate-900 dark:text-white">
                      {m.first_name[0]}
                      {m.last_name[0]}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Kuya {m.first_name} {m.last_name}
                      </h4>
                      <Badge
                        variant={m.role === "admin" ? "gold" : m.role === "officer" ? "blue" : "neutral"}
                        size="sm"
                      >
                        {m.role === "admin" ? "National Directorate" : m.role === "officer" ? "Club Officer" : "Charter Member"}
                      </Badge>
                      <Badge variant={m.membership_status === "active" ? "green" : "yellow"} size="sm">
                        {m.membership_status === "active" ? "Good Standing" : "Pending Candidate"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex-wrap">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {m.member_number || "AGILA-PENDING"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Landmark className="h-3 w-3 text-slate-400" />
                        {m.chapter_or_branch || "Bantayog Elite Eagles Club"}
                      </span>
                      {m.email && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {m.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {onSelectMember && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectMember(m)}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <IdCard className="h-3.5 w-3.5 text-amber-500" />
                      View ID
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Showing {filteredMembers.length} of {members.length} Registered Members</span>
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs font-bold">
            Close Directory
          </Button>
        </div>
      </div>
    </div>
  );
}
