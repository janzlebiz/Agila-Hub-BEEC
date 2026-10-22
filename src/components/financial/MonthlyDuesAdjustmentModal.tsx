"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  HeartHandshake, 
  RefreshCw,
  Clock,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MonthlyRateConfig {
  totalAmount: number;
  renewalAmount: number;
  alalayangAndServiceAmount: number;
  lastUpdated: string;
  approvedBy?: string;
}

export interface RateProposal {
  id: string;
  proposedTotal: number;
  proposedRenewal: number;
  proposedAlalayang: number;
  proposedByRole: "treasurer" | "secretary" | "officer";
  proposedByName: string;
  effectiveDate: string;
  justification: string;
  submittedAt: string;
  status: "pending_approval" | "approved" | "rejected";
}

interface MonthlyDuesAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: "admin" | "officer" | "member";
  currentConfig: MonthlyRateConfig;
  pendingProposal: RateProposal | null;
  onSubmitProposal: (proposal: RateProposal) => void;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
}

export function MonthlyDuesAdjustmentModal({
  isOpen,
  onClose,
  currentRole,
  currentConfig,
  pendingProposal,
  onSubmitProposal,
  onApproveProposal,
  onRejectProposal,
}: MonthlyDuesAdjustmentModalProps) {
  const [total, setTotal] = useState<number>(currentConfig.totalAmount || 400);
  const [renewal, setRenewal] = useState<number>(currentConfig.renewalAmount || 100);
  const [alalayang, setAlalayang] = useState<number>(currentConfig.alalayangAndServiceAmount || 300);
  const [effectiveDate, setEffectiveDate] = useState<string>("2026-11-01");
  const [justification, setJustification] = useState<string>(
    "Adjustment to support increased community outreach and expand Alalayang Agila emergency assistance."
  );
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTotal(currentConfig.totalAmount || 400);
      setRenewal(currentConfig.renewalAmount || 100);
      setAlalayang(currentConfig.alalayangAndServiceAmount || 300);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const isPresident = currentRole === "admin";
  const isOfficer = currentRole === "officer" || isPresident;

  const handleTotalChange = (val: number) => {
    setTotal(val);
    // Maintain proportional 25% renewal / 75% alalayang breakdown by default
    const renewalPart = Math.round(val * 0.25);
    setRenewal(renewalPart);
    setAlalayang(val - renewalPart);
  };

  const handleRenewalChange = (val: number) => {
    setRenewal(val);
    setAlalayang(Math.max(0, total - val));
  };

  const handleAlalayangChange = (val: number) => {
    setAlalayang(val);
    setRenewal(Math.max(0, total - val));
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) {
      setError("Monthly contribution amount must be greater than zero.");
      return;
    }
    if (renewal + alalayang !== total) {
      setError(`Breakdown sum (₱${renewal} + ₱${alalayang} = ₱${renewal + alalayang}) must equal total monthly amount (₱${total}).`);
      return;
    }
    if (!justification.trim()) {
      setError("Please provide a fraternal justification / resolution note.");
      return;
    }

    const newProposal: RateProposal = {
      id: `prop-${Date.now()}`,
      proposedTotal: total,
      proposedRenewal: renewal,
      proposedAlalayang: alalayang,
      proposedByRole: isPresident ? "officer" : "treasurer",
      proposedByName: isPresident ? "Kuya President" : "Kuya Treasurer",
      effectiveDate,
      justification: justification.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending_approval",
    };

    onSubmitProposal(newProposal);
    setSuccessMsg("Rate adjustment proposed successfully! Pending review and executive approval by the Club President.");
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                Monthly Contribution Policy
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Managed by Treasurer & Secretary • Approved by Club President
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Active Rate Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-white/[0.04] dark:to-eagle-blue/10 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Chapter Rate
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              <ShieldCheck className="h-3 w-3" /> Official Policy
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-display font-black text-3xl text-slate-900 dark:text-white font-mono">
                ₱{currentConfig.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500 font-medium ml-1.5">/ member / month</span>
            </div>
          </div>

          {/* Allocation Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div className="p-2.5 rounded-xl bg-white dark:bg-canvas-slate/80 border border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-500 block">Membership Renewal</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                ₱{currentConfig.renewalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">National Secretariat dues</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-canvas-slate/80 border border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">Alalayang Agila & Service</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                ₱{currentConfig.alalayangAndServiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Welfare & community budget</span>
            </div>
          </div>
        </div>

        {/* Pending Proposal Banner (If Any) */}
        {pendingProposal && pendingProposal.status === "pending_approval" && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 animate-spin-slow" />
                <span className="font-display font-bold text-xs uppercase tracking-wider">
                  Pending Rate Adjustment Proposal
                </span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                {pendingProposal.proposedByRole.toUpperCase()} SUBMISSION
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-canvas-slate border border-amber-300/80 dark:border-amber-400/30">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-slate-500">Proposed New Rate:</span>
                <span className="font-display font-black text-lg text-slate-900 dark:text-white font-mono">
                  ₱{pendingProposal.proposedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                <div>• Renewal: ₱{pendingProposal.proposedRenewal.toLocaleString()}</div>
                <div>• Alalayang Agila & Service: ₱{pendingProposal.proposedAlalayang.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 italic mt-1">
                  Justification: &ldquo;{pendingProposal.justification}&rdquo;
                </div>
              </div>
            </div>

            {/* Presidential Approval Controls */}
            {isPresident ? (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-approve-dues-rate"
                  onClick={() => onApproveProposal(pendingProposal.id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" /> Approve Adjustment
                </button>
                <button
                  type="button"
                  id="btn-reject-dues-rate"
                  onClick={() => onRejectProposal(pendingProposal.id)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-rose-100 hover:text-rose-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                <span>Awaiting executive review and approval by the Club President.</span>
              </div>
            )}
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Adjustment Submission Form (Accessible to Treasurer / Secretary / Admin) */}
        {isOfficer && (
          <form onSubmit={handleSubmitProposal} className="mt-4 space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Propose Monthly Contribution Adjustment
              </span>
              <span className="text-[10px] text-slate-400">Treasurer / Secretary Tool</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                New Total Monthly Contribution (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                  ₱
                </span>
                <input
                  type="number"
                  required
                  min="100"
                  step="50"
                  value={total}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                />
              </div>
            </div>

            {/* Allocation Split Sliders / Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Renewal Share (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                    ₱
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    max={total}
                    step="25"
                    value={renewal}
                    onChange={(e) => handleRenewalChange(Number(e.target.value))}
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alalayang / Service (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                    ₱
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    max={total}
                    step="25"
                    value={alalayang}
                    onChange={(e) => handleAlalayangChange(Number(e.target.value))}
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Effective Date & Justification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Fraternal Justification
                </label>
                <input
                  type="text"
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Approved during General Assembly resolution..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-dues-proposal"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Submit Adjustment Proposal to President</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
