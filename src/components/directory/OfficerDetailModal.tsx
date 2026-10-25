"use client";

import React from "react";
import { X, ShieldCheck, Calendar, Building, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface OfficerItem {
  position: string;
  name: string;
  category: string;
  term?: string;
  termPeriod?: string;
  isVacant?: boolean;
  club?: string;
}

interface OfficerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer: OfficerItem | null;
}

export function OfficerDetailModal({
  isOpen,
  onClose,
  officer,
}: OfficerDetailModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !officer) return null;

  const isVacant = Boolean(officer.isVacant || !officer.name || officer.name.toLowerCase().includes("vacant"));
  const term = officer.term || "2026";
  const termPeriod = officer.termPeriod || "January 1, 2026 – December 31, 2026";
  const club = officer.club || "Bantayog Elite Eagles Club";

  const getPositionDescription = (pos: string, cat: string) => {
    const p = pos.toUpperCase();
    if (p.includes("PRESIDENT") && !p.includes("VICE")) {
      return "Chief Executive of the Club. Presides over all general assemblies, executive committee meetings, and represents the club in national fraternal affairs.";
    }
    if (p.includes("VICE PRESIDENT")) {
      return "Assists the President in executive administration and assumes presidential duties during absence or disability.";
    }
    if (p.includes("SECRETARY") || p.includes("INFORMATION")) {
      return "Maintains official fraternal records, minutes of assemblies, communications, and official membership rosters.";
    }
    if (p.includes("TREASURER")) {
      return "Custodian of fraternal treasury funds, official receipts, disbursements, and audited balance sheets.";
    }
    if (p.includes("AUDITOR")) {
      return "Conducts quarterly financial audits, reconciles vault reserves with vouchers, and issues certified audit reports.";
    }
    if (p.includes("PROTOCOL")) {
      return "Oversees fraternal decorum, ceremonies, guest protocols, and official event proceedings.";
    }
    if (p.includes("PEACE")) {
      return "Maintains fraternal order, security, and tranquility during assemblies and community outreach missions.";
    }
    if (p.includes("BOARD")) {
      return "Member of the Directorate. Formulates governing club policies, ratifies budget allocations, and oversees strategic governance.";
    }
    if (p.includes("CARE") || p.includes("ALALAYAN") || p.includes("COMMUNITY")) {
      return "Leads fraternal humanitarian missions, benevolent disaster relief grants, and community outreach programs.";
    }
    return `Serves under the ${cat} committee in accordance with the ratified Magna Carta and Constitution of TFOE-PE.`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="officer-modal-title"
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

        {/* Officer Header */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md mb-3 flex items-center justify-center">
            <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-amber-400">
              <ShieldCheck className="h-10 w-10" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap justify-center">
            <Badge variant="gold" size="sm">
              <Award className="h-3 w-3 mr-1" />
              {officer.category}
            </Badge>
            <Badge variant={isVacant ? "yellow" : "green"} size="sm">
              {isVacant ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" /> Vacant Office
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Filled Position
                </>
              )}
            </Badge>
          </div>

          <span className="text-[11px] font-mono font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
            {officer.position}
          </span>
          <h3
            id="officer-modal-title"
            className="font-display font-black text-xl text-slate-900 dark:text-white mt-0.5"
          >
            {isVacant ? "Position Vacant" : officer.name}
          </h3>
        </div>

        {/* Details Grid */}
        <div className="py-4 space-y-3 overflow-y-auto text-xs">
          {/* Term Period */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Calendar className="h-4 w-4 text-eagle-blue shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Term
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Term {term} • Active Office
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {termPeriod}
              </span>
            </div>
          </div>

          {/* Organizational Affiliation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <Building className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Chapter Affiliation
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {club}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                The Fraternal Order of Eagles • Philippine Eagles (TFOE-PE)
              </span>
            </div>
          </div>

          {/* Duties & Governance Description */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Role & Mandate
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {getPositionDescription(officer.position, officer.category)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs font-bold w-full">
            Close Officer Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
