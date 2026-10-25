"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Layers,
  Receipt,
  Sparkles,
} from "lucide-react";
import {
  calculateAnnualDuesSchedule,
  formatPeso,
  ContributionRecordLike,
  MonthlyDuesScheduleItem,
  PaymentStatusType,
} from "@/lib/financeUtils";

interface AnnualContributionsTableProps {
  defaultRate?: number;
  contributions: ContributionRecordLike[];
  memberId?: string | null;
  memberName?: string;
  memberNumber?: string;
  isOfficer?: boolean;
  membersList?: Array<{ id: string; name: string; memberNumber?: string | null }>;
}

export function AnnualContributionsTable({
  defaultRate = 400,
  contributions,
  memberId,
  memberName = "Kuya Antonio Luna",
  memberNumber = "AGILA-2026-004",
  isOfficer = false,
  membersList = [],
}: AnnualContributionsTableProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [viewMode, setViewMode] = useState<"allocation" | "receipts">("allocation");
  const [activeMemberId, setActiveMemberId] = useState<string>(memberId || "m-04");

  React.useEffect(() => {
    if (memberId) setActiveMemberId(memberId);
  }, [memberId]);

  const currentMemberInfo = useMemo(() => {
    if (isOfficer && membersList.length > 0) {
      const found = membersList.find((m) => m.id === activeMemberId);
      if (found) return { name: found.name, number: found.memberNumber || memberNumber };
    }
    return { name: memberName, number: memberNumber };
  }, [isOfficer, membersList, activeMemberId, memberName, memberNumber]);

  // Calculate authoritative annual dues schedule with payment allocation
  const scheduleResult = useMemo(() => {
    return calculateAnnualDuesSchedule({
      year: selectedYear,
      monthlyRate: defaultRate,
      contributions,
      memberId: activeMemberId,
    });
  }, [selectedYear, defaultRate, contributions, activeMemberId]);

  const {
    totalAssessed,
    totalSettled,
    balanceDue,
    totalAdvanceCreditCarriedForward,
    hasAdvancePayments,
    totalMonthsCoveredInAdvance,
    months,
  } = scheduleResult;

  // Status badge styling helper
  const renderStatusBadge = (status: PaymentStatusType) => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );
      case "Paid (Advance)":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-eagle-blue border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Sparkles className="h-3 w-3" /> Paid (Advance)
          </span>
        );
      case "Overpaid":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <ArrowUpRight className="h-3 w-3" /> Overpaid
          </span>
        );
      case "Partially Paid":
      case "Partially Paid (Overdue)":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="h-3 w-3" /> {status}
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden text-slate-900 dark:text-white transition-colors">
      {/* Top Header & Year Selector */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-eagle-blue dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-black text-sm tracking-wide text-slate-900 dark:text-white">
                Annual Club Contributions & Dues Summary
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Audited Member Schedule
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              <span>Account: <strong className="text-slate-700 dark:text-slate-200">{currentMemberInfo.name}</strong> ({currentMemberInfo.number})</span>
              <span>•</span>
              <span>Rate: {formatPeso(defaultRate)} / month</span>
            </div>
          </div>
        </div>

        {/* Controls: Audit Member Picker, View Mode & Year Selector */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Member Audit Selector for Officers */}
          {isOfficer && membersList.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden md:inline">Audit:</span>
              <select
                id="select-audit-member"
                value={activeMemberId}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                {membersList.map((m) => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Allocation vs Direct View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/10 p-1 border border-slate-200 dark:border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("allocation")}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] flex items-center gap-1 ${
                viewMode === "allocation"
                  ? "bg-eagle-blue text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Allocates advance payments to clear monthly dues obligations"
            >
              <Layers className="h-3 w-3" /> Allocation
            </button>
            <button
              type="button"
              onClick={() => setViewMode("receipts")}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] flex items-center gap-1 ${
                viewMode === "receipts"
                  ? "bg-eagle-blue text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Shows direct payments recorded by calendar month"
            >
              <Receipt className="h-3 w-3" /> Receipts
            </button>
          </div>

          {/* Year Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/10 p-1 border border-slate-200 dark:border-white/10 text-xs font-bold">
            {[2026, 2025, 2024].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                  selectedYear === year
                    ? "bg-eagle-blue text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reconciled Summary Cards Strip */}
      <div className="grid grid-cols-3 border-b border-slate-100 dark:border-white/5 divide-x divide-slate-100 dark:divide-white/5 bg-slate-50/60 dark:bg-white/[0.02] text-xs">
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Assessed
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block">
            {formatPeso(totalAssessed)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">12 Months Assessed</span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
            Amount Settled
          </span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-0.5 block">
            {formatPeso(totalSettled)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {totalAdvanceCreditCarriedForward > 0
              ? `Includes ${formatPeso(totalAdvanceCreditCarriedForward)} Advance Credit`
              : "Verified Receipts"}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Balance Due
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm mt-0.5 block">
            {formatPeso(balanceDue)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {balanceDue === 0 ? "Account Fully Settled" : "Remaining Assessment"}
          </span>
        </div>
      </div>

      {/* Advance Payment Reassurance Banner (Visible when member has advance payments) */}
      {hasAdvancePayments && (
        <div className="p-3 px-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-eagle-blue dark:text-blue-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              <strong>Advance Payment Active:</strong> Advance lump-sum payment automatically covers subsequent months (e.g. November and December) without monthly distortion.
            </span>
          </div>
        </div>
      )}

      {/* A. MOBILE-RESPONSIVE VIEW (< 640px): Month-by-Month Payment Cards */}
      <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/5">
        {months.map((row) => {
          const displayPaid = viewMode === "allocation" ? row.allocatedPaidAmount : row.directPaidAmount;
          return (
            <div key={row.monthIndex} className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {row.monthName}
                  </span>
                  {row.isDueToday && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-eagle-blue dark:text-blue-400">
                      Due Today
                    </span>
                  )}
                </div>
                {renderStatusBadge(row.status)}
              </div>

              {/* Assessment vs Paid Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Assessed</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatPeso(row.assessedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    {viewMode === "allocation" ? "Applied Dues" : "Amount Paid"}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatPeso(displayPaid)}
                  </span>
                </div>
              </div>

              {/* Allocation Note / Advance Indicator */}
              {row.allocationNote && (
                <div className="text-[11px] font-medium text-eagle-blue dark:text-blue-400 flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>{row.allocationNote}</span>
                </div>
              )}

              {/* Dates and Reference */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Due Date: {row.dueDateFormatted}</span>
                <span>Date Paid: {row.datePaid}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* B. DESKTOP / TABLET VIEW (>= 640px): Structured Luxury Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4">Month</th>
              <th className="py-3 px-3">Assessed Amount</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">
                {viewMode === "allocation" ? "Applied Dues" : "Direct Paid"}
              </th>
              <th className="py-3 px-4">Allocation & Notes</th>
              <th className="py-3 px-4 text-right">Date Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
            {months.map((row) => {
              const displayPaid = viewMode === "allocation" ? row.allocatedPaidAmount : row.directPaidAmount;
              return (
                <tr
                  key={row.monthIndex}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {row.monthName}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatPeso(row.assessedAmount)}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {row.dueDateFormatted}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {renderStatusBadge(row.status)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatPeso(displayPaid)}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                    {row.allocationNote ? (
                      <span className="text-eagle-blue dark:text-blue-300 font-medium">
                        {row.allocationNote}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {row.datePaid}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
